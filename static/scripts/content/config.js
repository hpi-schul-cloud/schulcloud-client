module.exports = {
  configs: {
    API: {
      clientURL: process.env.HOST,
      serverURL: process.env.BACKEND_URL,
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
  }
};
