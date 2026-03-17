export interface UserAgentBrowser {
    name?: string;
    version?: string;
    major?: string;
    type?: string;
}

export interface UserAgentCpu {
    architecture?: string;
}

export interface UserAgentDevice {
    type?: string;
    vendor?: string;
    model?: string;
}

export interface UserAgentEngine {
    name?: string;
    version?: string;
}

export interface UserAgentOs {
    name?: string;
    version?: string;
}

export interface UserAgent {
    ua?: string;
    browser?: UserAgentBrowser;
    cpu?: UserAgentCpu;
    device?: UserAgentDevice;
    engine?: UserAgentEngine;
    os?: UserAgentOs;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    country: string;
    region: string;
    city: string;
}

export interface UserTermPolicy {
    termsOfService: boolean;
    privacy: boolean;
    marketing: boolean;
    cookies: boolean;
}

export interface UserPhoto {
    bucket: string;
    key: string;
    cdnUrl?: string;
    completedUrl: string;
    mime: string;
    extension: string;
    access: string;
}

export interface RoleAbility {
    action: string[];
    subject: string;
}

export interface TermPolicyContent {
    language: string;
    bucket: string;
    key: string;
    cdnUrl?: string;
    completedUrl: string;
    mime: string;
    extension: string;
    access: string;
    size: number;
}
