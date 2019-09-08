import R from 'ramda';


export function contactUserNameFormatter(user) {
  if (R.isNil(user)) {
    return "";
  }
  if (R.isNil(user.name)) {
    return user.email;
  }
  return user.firstName + " " + user.name;
}

export function contactUserPhoneFormatter(user) {
  let str;
  if (R.isNil(user)) {
    return "";
  }
  if (user.phone1) {
    str = user.phone1;
  }
  return str;
}

export function contactUserEmailFormatter(user) {
  if (R.isNil(user)) {
    return "";
  }
  return user.email;
}
