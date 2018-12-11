const localforage = require('localforage');

const courseDownloader = {

    initialize(config) {

        this._cacheName = config.cacheName;

        this._courseStore = localforage.createInstance({
            name: 'courses'
        });

        this._courseOfflineStore = localforage.createInstance({
            name: 'coursesOffline'
        });

        this._initialized = true;

    },

    isReady(){
        return this._initialized === true;
    },

    addToCache(data) {
        return caches.open(this._cacheName)
            .then(cache => cache.add(data.url))
            .then(_ => this._courseStore.setItem(data.url, data))
            .then(_ => cacheEvents.added(this._cacheName, data.url))
            .then(_ => Promise.resolve(data));
    },

    testInCache(data) {
        return caches.open(this._cacheName)
            .then(cache => cache.match(data.url))
            .then(response => {
                if (response !== undefined) {
                    data.inCache = true;
                    Promise.resolve(true);
                } else {
                    data.inCache = false;
                    cacheEvents.removed(this._cacheName, data.url);
                    Promise.resolve(false);
                }
            });
    },

    updateNotificationDownloadState(urls){
        
        // https://stackoverflow.com/questions/42341331/es6-promise-all-progress
        function allProgress(promises, progress_cb) {
            let d = 0;
            progress_cb(0);
            promises.forEach((p) => {
              p.then(()=> {    
                d ++;
                progress_cb( (d * 100) / promises.length );
              });
            });
            return Promise.all(promises);
          }

         function refreshNotification(progress){
             progress = parseInt(progress);
             const options = { tag: 'course-data-downloading' };
             return self.registration.getNotifications(options)
                 .then(notifications =>{
                     notifications.forEach(notification => notification.close());
                     const notificationTitle = 'Kursinhalte werden aktualisiert.';
                     const notificationOptions = {
                         body: `${progress}% der Inhalte heruntergeladen.`,
                         tag: 'course-data-downloading'
                     };
                    return self.registration.showNotification(notificationTitle, notificationOptions);  
                 });
         } 

        return allProgress(urls, refreshNotification);
        },

    downloadCourse(courseId, notification) {

        let urls = {};

        let currentVal, newVal;
        return this._courseOfflineStore.getItem(courseId).then(value => {

            // cleanup existing data

            // step over, if course never seen before
            if (value === null) return;
            let promiseChain = [];
            // test course in cache as expected, otherwise remove
            if (value.course) {
                promiseChain.push(this.testInCache(value.course));
            }
            // test lessons in cache as expected, otherwise remove
            if (value.lessons && value.lessons.length !== 0) {
                value.lessons.forEach(lesson => {
                    promiseChain.push(this.testInCache(lesson));
                }
                );
            }
            // test files in cache as expected, otherwise remove
            if (value.files && value.files.length !== 0) {
                value.files.forEach(file => {
                    promiseChain.push(this.testInCache(file));
                }
                );
            }
            // remove data from course if no more in cache
            return Promise.all(promiseChain).then(_ => {
                if (value.course && value.course.inCache === false) {
                    delete value.course;
                }
                if (value.lessons && value.lessons.length !== 0) {
                    value.lessons = value.lessons.filter(lesson => lesson.inCache);
                }
                if (value.files && value.files.length !== 0) {
                    value.files = value.files.filter(file => file.inCache);
                }
                return Promise.resolve(value);
            });
        }).then(value => {

            // fetch course data, if something already cached,
            // request diff and convert to json

            currentVal = value || {};
            return fetch(`/courses/${courseId}/offline`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentVal)
            }).then(response => response.json());
        }).then(json => {
                if (json.cleanup && json.cleanup.course) {
                    return caches.open(this._cacheName)
                        .then(cache => cache.delete(json.cleanup.course.url))
                        .then(_ => cacheEvents.removed('courses', json.cleanup.course.url))
                        .then(_ => {
                            if (currentVal.course) {
                                delete currentVal.course;
                            }
                            return json;
                        });
                }
                return json;
            })            .then(json => {

                // remove data which has been removed on server side
                if (json.cleanup && json.cleanup.lessons) {
                    let lessonsToRemove = currentVal.lessons.filter(lesson => json.cleanup.lessons.includes(lesson._id));
                    if (lessonsToRemove) {
                        // remove data from cache
                        return Promise.all(lessonsToRemove.map(lesson => {
                            return caches.open(this._cacheName)
                                .then(cache => cache.delete(lesson.url))
                                .then(success => {
                                    cacheEvents.removed('courses', lesson.url);
                                    Promise.resolve(success);
                                });
                        })).then(_ => {
                            // cleanup dataset
                            currentVal.lessons = currentVal.lessons.filter(lesson => !json.cleanup.lessons.includes(lesson._id));
                            if (currentVal.cleanup && currentVal.cleanup.lessons) delete currentVal.cleanup.lessons;
                            return json;
                        });
                    }
                }
                return json;

            }).then(json => {

                // remove data which has been removed on server side
                if (json.cleanup && json.cleanup.files) {
                    let filesToRemove = currentVal.files.filter(file => json.cleanup.files.includes(file._id));
                    if (filesToRemove) {
                        // remove data from cache
                        return Promise.all(filesToRemove.map(file => {
                            return caches.open(this._cacheName)
                                .then(cache => cache.delete(file.url))
                                .then(success => {
                                    cacheEvents.removed('courses', file.url);
                                    Promise.resolve(success);
                                });
                        })).then(_ => {
                            // cleanup dataset
                            currentVal.files = currentVal.files.filter(file => !json.cleanup.files.includes(file._id));
                            if (currentVal.cleanup && currentVal.cleanup.files) delete currentVal.cleanup.files;
                            return json;
                        });
                    }
                }
                return json;

            }).then(json => {
                // dataset contains content for adding to cache, download data
                newVal = json;
                let urls = [];
                if (json.course) {
                    urls.push(this.addToCache(json.course));
                }
                if (json.lessons && json.lessons.length !== 0) {
                    json.lessons.map(lesson => urls.push(this.addToCache(lesson)));
                }
                if (json.files && json.files.length !== 0) {
                    json.files.map(file => urls.push(this.addToCache(file)));
                }
                // todo add courseId to notification tag
                return this.updateNotificationDownloadState(urls);
                //return Promise.all(urls);
            }).then(_ => {
                // add downloaded dataset to already existing one
                let updatedValue = {};
                updatedValue.course = newVal.course || currentVal.course;
                updatedValue.lessons = currentVal.lessons || [];
                if (newVal.lessons) {
                    newVal.lessons.forEach(lesson => {
                        let oldLesson = updatedValue.lessons.find(l => l._id === lesson._id);
                        if (oldLesson) {
                            Object.assign(oldLesson, lesson);
                        } else {
                            updatedValue.lessons.push(lesson);
                        }
                    });
                }
                updatedValue.files = currentVal.files || [];
                if (newVal.files) {
                    newVal.files.forEach(file => {
                        let oldfile = updatedValue.files.find(l => l._id === file._id);
                        if (oldfile) {
                            Object.assign(oldfile, file);
                        } else {
                            updatedValue.files.push(file);
                        }
                    });
                }
                return this._courseOfflineStore.setItem(courseId, updatedValue)
                    .then(_ => { console.log('updated', courseId); return Promise.resolve('course updated'); });

            });
    }

};

const cacheEvents = {

    _observers: [],

    added: function (cacheName, url) {
        console.log('added to cache', cacheName, url);
        this._observers.forEach(observer => observer.notify({
            action: 'added',
            cacheName,
            url
        }));
        return;
    },

    removed: function (cacheName, url) {
        console.log('removed from cache', cacheName, url);
        this._observers.forEach(observer => {
            if (observer && observer.notify) {
                observer.notify({
                    action: 'removed',
                    cacheName,
                    url
                });
            }
        });
        return;
    },

    subscribe: function (observer) {
        return this._observers.push(observer);
    },

    unsubscribe: function (observer) {
        return this._observers = this._observers.filter(o => o !== observer);
    }
};





module.exports = { courseDownloader, cacheEvents };
