angular.module('synsorcare.services.user', [
    'LocalStorageModule'
])
    .service('synsorcare.services.UserService', ['$http', '$q', 'env', 'localStorageService', function ($http, $q, env, localStorageService) {
        return {
            login: function (username, password) {
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/authenticate', {
                    username: username,
                    password: password
                }).then(function (resp) {
                    if(resp.data.csrfToken) {
                        sessionStorage.setItem('x-csrf', resp.data.csrfToken);
                        $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                    }
                    sessionStorage.setItem('X-Session-Token', resp.headers('X-Session-Token'));
                    $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                    deferred.resolve(resp.data.user);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            fetchCachedUser: function () {
                return localStorageService.get('currentUser') || null;
            },

            setCachedUser: function (userData) {
                localStorageService.set('currentUser', userData);
            },

            clearCachedUser: function () {
                localStorageService.remove('currentUser');
            },

            fetchAllUsers: function () {
                var deferred = $q.defer();
                $http.get(env.apiBaseUrl + '/rest/user').then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            createUser: function (userData) {
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/register', userData).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            updateUser: function (userData) {
                var deferred = $q.defer();
                $http.put(env.apiBaseUrl + '/rest/user/' + userData.id, userData).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            deleteUser: function (userId) {
                var deferred = $q.defer();
                $http.delete(env.apiBaseUrl + '/rest/user/' + userId).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            //send reset link to user email
            resetPasswordLink: function(email){
                var deferred = $q.defer();
                $http.post(env.apiBaseUrl + '/forgot/send/' + email,{},{timeout:10000}).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },

            resetPasswordViaCode: function(data){
              var deferred = $q.defer();
              $http.post(env.apiBaseUrl + '/forgot/reset/', {data: data}, {timeout: 10000}).then(function (resp) {
                  deferred.resolve(resp.data);
              }).catch(deferred.reject);
              return deferred.promise;
          },
          getDashboardData: function(id){
              return $http.get(env.apiBaseUrl + 'rest/provider/' + id + '/dashboard')
                  .then(function (resp) {
                      return resp.data;
                  });
          },
          getReports: function(id){
              return $http.get(env.apiBaseUrl + 'rest/provider/' + id + '/reports')
                  .then(function (resp) {
                      return resp.data;
                  });
          }
        };
    }]);
