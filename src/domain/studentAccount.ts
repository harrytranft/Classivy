// Cửa vào cho giao diện: logic tài khoản học sinh nằm ở supabase/functions/_shared để Edge Function (Deno)
// và app dùng chung một bản (test: studentAccount.test.ts).
export {
  MAX_BATCH, STUDENT_EMAIL_DOMAIN, USERNAME_PATTERN, isStudentEmail, isValidUsername, normalizeLoginInput, toAsciiLetters, usernameToEmail
} from '../../supabase/functions/_shared/studentAccount';
