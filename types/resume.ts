export type TemplateId =
  | "modern"
  | "ats"
  | "minimal"
  | "developer"
  | "classic"
  | "executive"
  | "timeline"
  | "compact"
  | "editorial"
  | "accent"
  | "split"
  | "mono";
export type ThemeId = "purple" | "charcoal" | "taupe" | "navy" | "blue" | "teal" | "green" | "orange" | "red";
export type TemplateTag = "popular" | "latest" | "new" | "trending" | "recommended";
export type ResumeTextColorKey = "name" | "description" | "subtitle" | "meta";
export type ResumeTextColors = Partial<Record<ResumeTextColorKey, string>>;
export type ResumeSectionKey = "summary" | "skills" | "experience" | "projects" | "education" | "certifications" | "achievements";
export type ResumeInitialsShape = "square" | "round";
export type ResumeInitialsPosition = "left" | "center" | "right";
export type ResumeInitialsStyle = {
  hidden?: boolean;
  letterColor?: string;
  boxColor?: string;
  shape?: ResumeInitialsShape;
  position?: ResumeInitialsPosition;
  image?: string;
  originalImage?: string;
  scale?: number;
};

export type PersonalInfo = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
};

export type Education = {
  college: string;
  degree: string;
  cgpa: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Experience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type Project = {
  name: string;
  description: string;
  technologies: string;
  github: string;
  live: string;
};

export type Certification = {
  name: string;
  provider: string;
  date: string;
  description: string;
};

export type Achievement = {
  title: string;
  description: string;
};

export type ResumeData = {
  title: string;
  templateId: TemplateId;
  themeId: ThemeId;
  textColors: ResumeTextColors;
  hiddenSections?: ResumeSectionKey[];
  initialsStyle: ResumeInitialsStyle;
  personal: PersonalInfo;
  summary: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
};
