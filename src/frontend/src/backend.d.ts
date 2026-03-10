import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PendingDelivery {
    id: bigint;
    customerName: string;
    date: string;
    brickSelections: Array<BrickSelection>;
    deliveryType: DeliveryType;
    distance: number;
    batsNotes?: string;
    address: string;
    dueAmount: number;
}
export interface CompleteDelivery {
    id: bigint;
    customerName: string;
    vehicleType: VehicleType;
    date: string;
    vehicleNumber: string;
    calculatedAmount: number;
    unloadingLabor: Array<string>;
    brickSelections: Array<BrickSelection>;
    loadingLabor: Array<string>;
    deliveryType: DeliveryType;
    distance: number;
    batsNotes?: string;
    address: string;
    dueAmount: number;
}
export interface BrickSelection {
    quantity: bigint;
    brickType: string;
}
export enum DeliveryType {
    local = "local",
    outside = "outside"
}
export enum VehicleType {
    twelveWheel = "twelveWheel",
    tractor = "tractor"
}
export interface backendInterface {
    addVehicle(vehicleType: VehicleType, vehicleNumber: string): Promise<void>;
    createPendingDelivery(date: string, customerName: string, address: string, dueAmount: number, distance: number, deliveryType: DeliveryType, brickSelections: Array<BrickSelection>, batsNotes: string | null): Promise<void>;
    deletePendingDelivery(id: bigint): Promise<void>;
    getAllCompleteDeliveries(): Promise<Array<CompleteDelivery>>;
    getAllPendingDeliveries(): Promise<Array<PendingDelivery>>;
    removeVehicle(vehicleNumber: string): Promise<void>;
}
