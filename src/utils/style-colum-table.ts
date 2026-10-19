import { max } from "lodash";

export const styleColumTable = {
  sm: {
    style: {
      width: 80,
    },
  },
  md: {
    style: {
      width: 150,
    },
  },
  lg: {
    style: {
      width: 240,
      maxWidth: 240,
    },
  },
  date: {
    style: {
      width: 120,
    },
  },
  input: {
    style: {
      width: 180,
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  button: {
    style: {
      width: 40,
      paddingTop: 0,
      paddingBottom: 0,
      paddingRight: 10,
    },
  },
  buttonEdit: {
    style: {
      width: 40,
      paddingTop: 0,
      paddingBottom: 0,
      paddingRight: 0,
    },
  },
  menu: {
    style: {
      width: 40,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 16,
      alignItems: "center",
      justifyContent: "center",
    },
  },
  id: {
    style: {
      width: 40,
      paddingTop: 0,
      paddingBottom: 0,
      paddingRight: 0,
    },
  },
  
} as const;
