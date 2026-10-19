export default function getStatusRouter(status: boolean) {
  switch (status) {
    case false:
      return "inactivate";
    case true:
      return "activate";
  }
}
