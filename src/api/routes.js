import { getRequest, putRequest, postRequest, postRequestJwt, getReq } from './request';
import { getRequestOSRM } from './requestOSRM';
import { getRequestUpdate } from './requestUpdate';

export async function uploadLocation(params) {
  return putRequest('/geo_info_users', params);
}

export async function getRoutes(userId) {
  return await getReq(`/routes?user=${userId}`).then(res => res.data);
}



export async function getRoute(uid) {
  return getRequest(`/route/${uid}`);
}

export async function postRoute(uid, payload) {
  return postRequest(`/route/${uid}`, payload);
}

//-- osrm

export async function getOSRM(coordinates) {
  return getRequestOSRM(coordinates);
}

//-- update

export async function getUpdate() {
  return getRequestUpdate();
}



