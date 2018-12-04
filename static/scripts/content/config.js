// mymodule.js
module.exports = {
  configs: {
    API: {
      baseUrl: 'http://localhost', //'https://schul-cloud.org',
      port: ':3030',
      clientPort: ':3100',
      authPath: '/authentication',
      pwRecoveryPath: '/login?recovery=true',
      getPath: '/content/resources/',
      searchPath: '/content/search/',
      pushContentPath: '/resources/',
      redirectPath: '/content/redirect/',
      userInfoPath: '/users/',
    },
    card: {
      displayedTags: 9,
    },
  },
};
