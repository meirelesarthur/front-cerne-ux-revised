import CryptoJS from "crypto-js";

import { ThemeTypes } from "@/contexts/ThemeContext";
import { UnitTypes } from "@/contexts/UnitContext";

import { AuthToken, AuthTokenAdmin, AuthTokenPlant } from "@/@types/auth-token";
import { LanguageContextTypes } from "@/@types/language";
import { CompanyData } from "@/@types/v2/Admin/company";
import { UserData } from "@/@types/v2/Admin/user";

import { clearLocalStorageByKeySubstring } from "./storageUtils";

const jwtSecurityToken = "aleex-ai.jwtSecurityToken";
const jwtRefreshToken = "aleex-ai.jwtRefreshToken";
const jwtSecurityTokenSampling = "gb.armazem.jwtSecurityTokenSampling";
const jwtRefreshTokenSampling = "aleex-ai.jwtRefreshTokenSampling";
const jwtSecurityTokenPlant = "aleex-ai.jwtSecurityTokenPlant";
const jwtRefreshTokenPlant = "aleex-ai.jwtRefreshTokenPlant";
const userSystem = "aleex-ai.user";
const userCompany = "aleex-ai.company";
const userCompanyInUse = "aleex-ai.companyInUse";
const themeGB = "aleex-ai.theme";
const projectGB = "aleex-ai.project";
const projectInUseGB = "aleex-ai.projectInUse";
const languageGB = "aleex-ai.language";
const unitGB = "aleex-ai.unit";
const secretKey = "Caramel.2024";
const pathSidbarGB = "pathSidbar";
const notificationQueue = "notificationQueue";

function encryptData(data: string) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

function decryptData(data: string) {
  const bytes = CryptoJS.AES.decrypt(data, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function getAuthTokens(): AuthToken {
  const encryptedToken = localStorage.getItem(jwtSecurityToken);
  const encryptedRefreshToken = localStorage.getItem(jwtRefreshToken);

  const token = encryptedToken ? decryptData(encryptedToken) : null;
  const refreshToken = encryptedRefreshToken
    ? decryptData(encryptedRefreshToken)
    : null;

  return { token, refreshToken };
}

export function getAuthTokensAdmin(): AuthTokenAdmin {
  const encryptedTokenAdmin = localStorage.getItem(jwtSecurityTokenSampling);
  const encryptedRefreshTokenAdmin = localStorage.getItem(
    jwtRefreshTokenSampling,
  );

  const tokenAdmin = encryptedTokenAdmin
    ? decryptData(encryptedTokenAdmin)
    : null;
  const refreshTokenAdmin = encryptedRefreshTokenAdmin
    ? decryptData(encryptedRefreshTokenAdmin)
    : null;

  return { tokenAdmin, refreshTokenAdmin };
}

export function getAuthTokensPlant(): AuthTokenPlant {
  const encryptedTokenPlant = localStorage.getItem(jwtSecurityTokenPlant);
  const encryptedRefreshTokenPlant = localStorage.getItem(jwtRefreshTokenPlant);

  const tokenPlant = encryptedTokenPlant
    ? decryptData(encryptedTokenPlant)
    : null;
  const refreshTokenPlant = encryptedRefreshTokenPlant
    ? decryptData(encryptedRefreshTokenPlant)
    : null;

  return { tokenPlant, refreshTokenPlant };
}

export function getUserSystem() {
  const storedString = localStorage.getItem(userSystem);
  const userSystemGB = storedString
    ? JSON.parse(decryptData(storedString))
    : null;
  return userSystemGB as UserData | null;
}

export function getCompanySystemGB() {
  const storedString = sessionStorage.getItem(userCompany);
  const companySystemGB = storedString
    ? JSON.parse(decryptData(storedString))
    : null;
  return companySystemGB as CompanyData | null;
}
export function getCompanySystemGBInUse() {
  const storedString = localStorage.getItem(userCompanyInUse);
  const companySystemGB = storedString
    ? JSON.parse(decryptData(storedString))
    : null;
  return companySystemGB as CompanyData | null;
}

export function getThemeGB(): ThemeTypes {
  const theme = localStorage.getItem(themeGB);
  return theme as ThemeTypes;
}

export function getLanguageGB(): LanguageContextTypes {
  const project = localStorage.getItem(languageGB);
  return project as LanguageContextTypes;
}
export function getUnitGB(): UnitTypes {
  const unit = localStorage.getItem(unitGB);
  return unit as UnitTypes;
}

export function getPathSidbar(): string {
  const pathSidbar = sessionStorage.getItem(pathSidbarGB);
  return pathSidbar as string;
}

export function saveAuthToken(token: string, refreshToken: string) {
  localStorage.setItem(jwtSecurityToken, encryptData(token ? token : ""));
  localStorage.setItem(
    jwtRefreshToken,
    encryptData(refreshToken ? refreshToken : ""),
  );
}

export function saveAuthTokenSampling(token: string, refreshToken: string) {
  localStorage.setItem(
    jwtSecurityTokenSampling,
    encryptData(token ? token : ""),
  );
  localStorage.setItem(
    jwtRefreshTokenSampling,
    encryptData(refreshToken ? refreshToken : ""),
  );
}

export function saveAuthTokenPlant(token: string, refreshToken: string) {
  localStorage.setItem(jwtSecurityTokenPlant, encryptData(token ? token : ""));
  localStorage.setItem(
    jwtRefreshTokenPlant,
    encryptData(refreshToken ? refreshToken : ""),
  );
}

export function saveUserSystemGB(userSystemGB: UserData) {
  localStorage.setItem(
    userSystem,
    encryptData(JSON.stringify(userSystemGB ? userSystemGB : {})),
  );
}

export function saveCompanySystemGB(companyGB: CompanyData) {
  sessionStorage.setItem(
    userCompany,
    encryptData(JSON.stringify(companyGB ? companyGB : {})),
  );
}

export function saveCompanySystemGBInUse(companyGB: CompanyData) {
  localStorage.setItem(
    userCompanyInUse,
    encryptData(JSON.stringify(companyGB ? companyGB : {})),
  );
}

export function saveThemeGB(theme: ThemeTypes) {
  localStorage.setItem(themeGB, theme);
}

export function saveLanguageGB(language: LanguageContextTypes) {
  localStorage.setItem(languageGB, language);
}

export function saveUnitGB(unit: UnitTypes) {
  localStorage.setItem(unitGB, unit);
}
export function savePathSidbarGB(pathSidbar: string) {
  sessionStorage.setItem(pathSidbarGB, pathSidbar);
  clearLocalStorageByKeySubstring("storageKeyGB");
}

export function clearAuth() {
  localStorage.removeItem(jwtSecurityToken);
  localStorage.removeItem(jwtRefreshToken);
  localStorage.removeItem(jwtSecurityTokenSampling);
  localStorage.removeItem(jwtRefreshTokenSampling);
  localStorage.removeItem(jwtSecurityTokenPlant);
  localStorage.removeItem(jwtRefreshTokenPlant);
  localStorage.removeItem(userSystem);
  localStorage.removeItem(projectInUseGB);
  localStorage.removeItem(userCompanyInUse);
  localStorage.removeItem(notificationQueue);
  sessionStorage.removeItem(projectGB);
  sessionStorage.removeItem(userCompany);
  sessionStorage.removeItem(pathSidbarGB);
}
