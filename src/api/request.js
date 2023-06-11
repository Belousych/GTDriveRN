import axiosInstance from './axios';

export async function getRequest(url, params = {}) {
  const req = axiosInstance.get(`${url}`, {params});

  return req
    .then(res => res.data)
    .catch(error => {
      console.error(error.toJSON());
      return error.toJSON();
    });
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

export async function putRequest(url, payload = {}) {
  const req = axiosInstance.put(url, payload);

  return req
    .then(res => res.data)
    .catch(error => {
      console.error(error.toJSON());
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