import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

actor {
  module Delivery {
    public type VehicleType = {
      #tractor;
      #twelveWheel;
    };

    public type DeliveryType = {
      #local;
      #outside;
    };

    public type BrickSelection = {
      brickType : Text;
      quantity : Nat;
    };

    public type PendingDelivery = {
      id : Nat;
      date : Text;
      customerName : Text;
      address : Text;
      dueAmount : Float;
      distance : Float;
      deliveryType : DeliveryType;
      brickSelections : [BrickSelection];
      batsNotes : ?Text;
    };

    public type CompleteDelivery = {
      id : Nat;
      date : Text;
      customerName : Text;
      address : Text;
      dueAmount : Float;
      distance : Float;
      deliveryType : DeliveryType;
      brickSelections : [BrickSelection];
      batsNotes : ?Text;
      vehicleType : VehicleType;
      vehicleNumber : Text;
      loadingLabor : [Text];
      unloadingLabor : [Text];
      calculatedAmount : Float;
    };
  };

  module Settings {
    public type Vehicle = {
      vehicleType : Delivery.VehicleType;
      vehicleNumber : Text;
    };

    public type RateSettings = {
      tractorLocal : Float;
      tractorOutside : Float;
      tractorSafetyBats : Float;
      twelveWheelRate : Float;
      twelveWheelSafety : Float;
    };
  };

  type PendingDelivery = Delivery.PendingDelivery;
  type CompleteDelivery = Delivery.CompleteDelivery;
  type Vehicle = Settings.Vehicle;
  type RateSettings = Settings.RateSettings;

  var nextDeliveryId = 1;
  var nextCompleteId = 1;

  public shared ({ caller }) func createPendingDelivery(
    date : Text,
    customerName : Text,
    address : Text,
    dueAmount : Float,
    distance : Float,
    deliveryType : Delivery.DeliveryType,
    brickSelections : [Delivery.BrickSelection],
    batsNotes : ?Text,
  ) : async () {
    let delivery : PendingDelivery = {
      id = nextDeliveryId;
      date;
      customerName;
      address;
      dueAmount;
      distance;
      deliveryType;
      brickSelections;
      batsNotes;
    };
    if (pendingDeliveries.containsKey(nextDeliveryId)) {
      Runtime.trap("Pending delivery already exists with ID " # nextDeliveryId.toText());
    };
    pendingDeliveries.add(nextDeliveryId, delivery);
    nextDeliveryId += 1;
  };

  public query ({ caller }) func getAllPendingDeliveries() : async [PendingDelivery] {
    pendingDeliveries.values().toArray();
  };

  public shared ({ caller }) func deletePendingDelivery(id : Nat) : async () {
    switch (pendingDeliveries.get(id)) {
      case (null) { Runtime.trap("Pending delivery does not exist") };
      case (?_) {
        pendingDeliveries.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllCompleteDeliveries() : async [CompleteDelivery] {
    completeDeliveries.values().toArray();
  };

  public shared ({ caller }) func addVehicle(vehicleType : Delivery.VehicleType, vehicleNumber : Text) : async () {
    let vehicle : Vehicle = {
      vehicleType;
      vehicleNumber;
    };
    vehicles.add(vehicleNumber, vehicle);
  };

  public shared ({ caller }) func removeVehicle(vehicleNumber : Text) : async () {
    switch (vehicles.get(vehicleNumber)) {
      case (null) { Runtime.trap("Vehicle does not exist") };
      case (?_) {
        vehicles.remove(vehicleNumber);
      };
    };
  };

  let vehicles = Map.empty<Text, Vehicle>();
  let pendingDeliveries = Map.empty<Nat, PendingDelivery>();
  let completeDeliveries = Map.empty<Nat, CompleteDelivery>();
};
