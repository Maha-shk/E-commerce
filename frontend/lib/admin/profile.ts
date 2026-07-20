export type AdminProfile = {
  name: string;
  initials: string;
  role: string;
  username: string;
  email: string;
  /** Account security completeness, 0–100. */
  accountSecurity: number;
};

/* ---- Demo data (placeholder) ---- */
export const adminProfile: AdminProfile = {
  name: "Alessandro Cento",
  initials: "AC",
  role: "Super Administrator",
  username: "admin_alessandro",
  email: "alessandro@centoservizi.com",
  accountSecurity: 92,
};
