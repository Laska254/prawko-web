// The field lengths and patterns the server accepts, shared by every form that asks for them.
export const NAME_LENGTH = {minLength: 3, maxLength: 31};
// The names' lengths, without @. Browsers show the input's `title` when the pattern isn't matched, so a form sets it to
// a message naming the @.
export const USERNAME_RULES = {...NAME_LENGTH, pattern: "[^@]*"};
export const EMAIL_LENGTH = {minLength: 5, maxLength: 254};
export const PASSWORD_LENGTH = {minLength: 7, maxLength: 63};
