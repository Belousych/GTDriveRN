import {axiosInstance, axiosInstanceDev, axiosInstanceDevToken} from './axios';

export async function getRequest(url, params = {}, isDev = false) {
  const req = !isDev
    ? axiosInstance.get(url, {params})
    : axiosInstanceDev.get(url, {params});

  return req
    .then(res => {
      return res.data;
    })
    .catch(error => {
      console.error(error.toJSON());
      return error.toJSON();
    });
}

export async function getReq(url, params = {}, isDev = false) {
  try {
    const req = !isDev
      ? axiosInstance.get(url, {params})
      : axiosInstanceDev.get(url, {params});

    console.log('API Response:', req);
    return req;
  } catch (error) {
    // Log any error that occurs during the request
    console.error('API request failed:', error);

    // You might want to throw the error again to handle it in the caller function
    throw error;
  }
}

export async function postRequest(url, payload = {}) {
  const req = axiosInstance.post(url, payload);

  return req
    .then(res => res.data)
    .catch(error => {
      console.error(error.toJSON());
      return error.toJSON();
    });
}

export async function putRequest(url, params = {}, isDev = false) {
  const req = !isDev
    ? axiosInstance.put(url, params)
    : axiosInstanceDev.put(url, params);

  return req
    .then(res => res.data)
    .catch(error => {
      console.error('putRequest', url, error.message);
      return error.toJSON();
    });
}

export async function deleteRequest(url) {
  const req = axiosInstance.delete(url);

  return req
    .then(res => res.data)
    .catch(error => {
      console.error(error.toJSON());
      return error.toJSON();
    });
}

export async function getRequestJwt(url) {
  const req = axiosInstanceDevToken.get(url);

  return req
    .then(res => res.data)
    .catch(error => {
      console.error(error.toJSON());
      return error.toJSON();
    });
}

export async function postRequestJwt(url, payload = {}) {
  const req = axiosInstanceDevToken.post(url, payload);

  return req
    .then(res => res.data)
    .catch(error => {
      console.error(error.toJSON());
      return error.toJSON();
    });
}

export const pingServer = async () => {
  return await axiosInstanceDev.get('/ping');
};
