import api from './client';

const trips = {
  sendReceipt: (id, email) => api.post(`/orders/${id}/send-receipt`, { email }),
  closeSession: () => api.post('/session/close'),
};

export default trips;
export const { sendReceipt, closeSession } = trips;
