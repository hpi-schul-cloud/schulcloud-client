import {courseDownloader} from './courseDownloader';

export const notificationHandler = {
    
    handle: function(registration, message){
        if(message.data){
            this.handleData(message.data);
        }
        if(message.notification){
            this.showNotification(registration, message.notification);
        }
    },
    handleData: function(data){
        switch(data.tag){
            case 'course-data-updated':
            console.log('download course data...');
            if(courseDownloader.isReady() !== true){
                courseDownloader.initialize({
                    cacheName: 'courses'
                });
            }
            courseDownloader.downloadCourse(data.courseId);
            break;
            default:
            console.log('unknown notification tag received', data.tag);
        }
    },
    
    showNotification: function (registration, notification) {
        const notificationTitle = notification.title;
        const notificationOptions = {
            body: notification.body,
            icon: notification.img || '/images/cloud.png'
        };
        return registration.showNotification(notificationTitle, notificationOptions);
    },

};
