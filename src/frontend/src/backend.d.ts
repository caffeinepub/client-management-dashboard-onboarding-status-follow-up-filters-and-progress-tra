import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ClientProgress {
    thighInch: number;
    chestInch: number;
    neckInch: number;
    hipsInch: number;
    weightKg: number;
    timestamp: Time;
    waistInch: number;
}
export type Time = bigint;
export interface FollowUpEntry {
    done: boolean;
    notes: string;
    timestamp: Time;
    followUpDay: FollowUpDay;
}
export interface PauseEntry {
    durationDays: bigint;
    resumed: boolean;
    timestamp: Time;
    reason: string;
}
export interface ExtendedClient {
    status: ClientStatus;
    pauseEntries: Array<PauseEntry>;
    endDate?: Time;
    activatedAt?: Time;
    code: bigint;
    name: string;
    pauseTime?: Time;
    totalPausedDuration: bigint;
    mobileNumber: string;
    followUpHistory: Array<FollowUpEntry>;
    planDurationDays: bigint;
    progress: Array<ClientProgress>;
    notes: string;
    followUpDay?: FollowUpDay;
    onboardingState: OnboardingState;
    startDate?: Time;
}
export interface UserProfile {
    name: string;
}
export enum ClientStatus {
    active = "active",
    paused = "paused"
}
export enum FollowUpDay {
    tuesday = "tuesday",
    wednesday = "wednesday",
    saturday = "saturday",
    thursday = "thursday",
    sunday = "sunday",
    friday = "friday",
    monday = "monday"
}
export enum OnboardingState {
    full = "full",
    half = "half"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateClient(clientCode: bigint, startDate: Time, followUpDay: FollowUpDay): Promise<void>;
    addProgress(clientCode: bigint, weightKg: number, neckInch: number, chestInch: number, waistInch: number, hipsInch: number, thighInch: number): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClient(name: string, mobileNumber: string, planDurationDays: bigint, notes: string, initialOnboardingState: OnboardingState): Promise<bigint>;
    filterClientsByOnboardingState(state: OnboardingState): Promise<Array<ExtendedClient>>;
    getAllClients(): Promise<Array<ExtendedClient>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClientProgress(clientCode: bigint): Promise<Array<ClientProgress>>;
    getClientsByFollowUpDay(day: FollowUpDay): Promise<Array<ExtendedClient>>;
    getExpiringClients(): Promise<Array<ExtendedClient>>;
    getFollowUpHistory(clientCode: bigint): Promise<Array<FollowUpEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    pauseClient(clientCode: bigint, durationDays: bigint, reason: string): Promise<void>;
    recordFollowUp(clientCode: bigint, followUpDay: FollowUpDay, done: boolean, notes: string): Promise<void>;
    resetOnboardingState(clientCode: bigint): Promise<void>;
    resumeClient(clientCode: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setFollowUpDay(clientCode: bigint, followUpDay: FollowUpDay): Promise<void>;
    updateOnboardingState(clientCode: bigint, state: OnboardingState): Promise<void>;
}
