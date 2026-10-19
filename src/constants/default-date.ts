export const defaultStartDate = new Date(
  new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toDateString()
);
export const defaultCurrentDate = new Date();
defaultCurrentDate.setHours(0, 0, 0, 0);
