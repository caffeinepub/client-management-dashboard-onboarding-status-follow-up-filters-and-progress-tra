import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

// Must use with-clause, never call migration.run directly
(with migration = Migration.run)
actor {
  // Authorization system using prefabricated component modules
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    // Other user metadata if needed
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type ClientProgress = {
    weightKg : Float;
    neckInch : Float;
    chestInch : Float;
    waistInch : Float;
    hipsInch : Float;
    thighInch : Float;
    timestamp : Time.Time;
  };

  module ClientProgress {
    public func compareByTime(x : ClientProgress, y : ClientProgress) : Order.Order {
      Int.compare(x.timestamp, y.timestamp);
    };
  };

  type FollowUpDay = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  module FollowUpDay {
    public func toOrdinal(day : FollowUpDay) : Nat {
      switch (day) {
        case (#monday) { 0 };
        case (#tuesday) { 1 };
        case (#wednesday) { 2 };
        case (#thursday) { 3 };
        case (#friday) { 4 };
        case (#saturday) { 5 };
        case (#sunday) { 6 };
      };
    };
    public func compare(day1 : FollowUpDay, day2 : FollowUpDay) : Order.Order {
      Nat.compare(toOrdinal(day1), toOrdinal(day2));
    };
  };

  type ClientStatus = {
    #active;
    #paused;
  };

  type OnboardingState = {
    #half;
    #full;
  };

  type PauseEntry = {
    timestamp : Time.Time;
    durationDays : Nat;
    reason : Text;
    resumed : Bool;
  };

  type FollowUpEntry = {
    timestamp : Time.Time;
    done : Bool;
    notes : Text;
    followUpDay : FollowUpDay;
  };

  type Client = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    planDurationDays : Nat;
    notes : Text;
    status : ClientStatus;
    onboardingState : OnboardingState;
    progress : [ClientProgress];
    pauseTime : ?Time.Time;
    totalPausedDuration : Int;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    activatedAt : ?Time.Time;
    pauseEntries : [PauseEntry];
    followUpDay : ?FollowUpDay;
    followUpHistory : [FollowUpEntry];
  };

  module Client {
    public func compareByPlanEndDate(x : Client, y : Client) : Order.Order {
      switch (x.endDate, y.endDate) {
        case (null, null) { #equal };
        case (null, ?_) { #greater };
        case (?_, null) { #less };
        case (?xEnd, ?yEnd) {
          Int.compare(xEnd, yEnd);
        };
      };
    };

    public func compareByFollowUpDay(client1 : Client, client2 : Client) : Order.Order {
      switch (client1.followUpDay, client2.followUpDay) {
        case (null, null) { #equal };
        case (null, ?_) { #greater };
        case (?_, null) { #less };
        case (?day1, ?day2) {
          FollowUpDay.compare(day1, day2);
        };
      };
    };

    public func getDueFollowUpDay(client : Client) : ?FollowUpDay {
      client.followUpDay;
    };
  };

  type ExtendedClient = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    planDurationDays : Nat;
    notes : Text;
    status : ClientStatus;
    onboardingState : OnboardingState;
    progress : [ClientProgress];
    pauseTime : ?Time.Time;
    totalPausedDuration : Int;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    activatedAt : ?Time.Time;
    pauseEntries : [PauseEntry];
    followUpDay : ?FollowUpDay;
    followUpHistory : [FollowUpEntry];
  };

  let clients = Map.empty<Nat, Client>();
  var clientCodeCounter = 1;

  public shared ({ caller }) func createClient(
    name : Text,
    mobileNumber : Text,
    planDurationDays : Nat,
    notes : Text,
    initialOnboardingState : OnboardingState,
  ) : async Nat {
    requireUserRole(caller);

    let clientCode = clientCodeCounter;
    clientCodeCounter += 1;

    let newClient : Client = {
      code = clientCode;
      name;
      mobileNumber;
      planDurationDays;
      notes;
      status = #active;
      onboardingState = initialOnboardingState;
      progress = [];
      pauseTime = null;
      totalPausedDuration = 0;
      startDate = null;
      endDate = null;
      activatedAt = null;
      pauseEntries = [];
      followUpDay = null;
      followUpHistory = [];
    };

    clients.add(clientCode, newClient);
    clientCode;
  };

  public shared ({ caller }) func setFollowUpDay(clientCode : Nat, followUpDay : FollowUpDay) : async () {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { trapNotFound("Client") };
      case (?client) {
        if (client.activatedAt == null) {
          Runtime.trap("Cannot set follow-up day until after client is activated.");
        };

        let updatedClient = {
          client with
          followUpDay = ?followUpDay;
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public shared ({ caller }) func recordFollowUp(clientCode : Nat, followUpDay : FollowUpDay, done : Bool, notes : Text) : async () {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        let newEntry : FollowUpEntry = {
          timestamp = Time.now();
          done;
          notes;
          followUpDay;
        };

        let updatedHistory = client.followUpHistory.concat([newEntry]);
        let updatedClient = {
          client with
          followUpHistory = updatedHistory;
        };

        clients.add(clientCode, updatedClient);
      };
    };
  };

  public query ({ caller }) func getFollowUpHistory(clientCode : Nat) : async [FollowUpEntry] {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { [] };
      case (?client) { client.followUpHistory };
    };
  };

  public shared ({ caller }) func addProgress(
    clientCode : Nat,
    weightKg : Float,
    neckInch : Float,
    chestInch : Float,
    waistInch : Float,
    hipsInch : Float,
    thighInch : Float,
  ) : async () {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { trapNotFound("Client") };
      case (?client) {
        let newProgress : ClientProgress = {
          weightKg;
          neckInch;
          chestInch;
          waistInch;
          hipsInch;
          thighInch;
          timestamp = Time.now();
        };

        let updatedProgress = client.progress.concat([newProgress]);
        let updatedClient = {
          client with
          progress = updatedProgress
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public shared ({ caller }) func pauseClient(clientCode : Nat, durationDays : Nat, reason : Text) : async () {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { trapNotFound("Client") };
      case (?client) {
        if (client.status == #paused) {
          Runtime.trap("Client is already paused");
        };
        let pauseEntry : PauseEntry = {
          timestamp = Time.now();
          durationDays;
          reason;
          resumed = false;
        };

        let updatedClient = {
          client with
          status = #paused;
          pauseTime = ?Time.now();
          pauseEntries = client.pauseEntries.concat([pauseEntry]);
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public shared ({ caller }) func resumeClient(clientCode : Nat) : async () {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { trapNotFound("Client") };
      case (?client) {
        switch (client.pauseTime, client.status) {
          case (?pauseStartTime, #paused) {
            let pausedDuration = Time.now() - pauseStartTime;

            let updatedPauseEntries = client.pauseEntries.map(
              func(entry) {
                if (not entry.resumed and Time.now() - entry.timestamp > 0) {
                  {
                    entry with
                    resumed = true
                  };
                } else {
                  entry;
                };
              }
            );

            let updatedClient = {
              client with
              status = #active;
              pauseTime = null;
              totalPausedDuration = client.totalPausedDuration + pausedDuration;
              endDate = client.endDate.map(func(endDate) { endDate + pausedDuration });
              pauseEntries = updatedPauseEntries;
            };
            clients.add(clientCode, updatedClient);
          };
          case (_) { Runtime.trap("Client is not currently paused ") };
        };
      };
    };
  };

  public shared ({ caller }) func activateClient(
    clientCode : Nat,
    startDate : Time.Time,
    followUpDay : FollowUpDay,
  ) : async () {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { trapNotFound("Client") };
      case (?client) {
        if (client.onboardingState != #full) {
          Runtime.trap("Cannot activate client: must complete all onboarding steps first.");
        };
        let endDate = startDate + (client.planDurationDays * 86_400_000_000_000);

        let updatedClient = {
          client with
          status = #active;
          startDate = ?startDate;
          endDate = ?endDate;
          activatedAt = ?Time.now();
          followUpDay = ?followUpDay;
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public shared ({ caller }) func updateOnboardingState(clientCode : Nat, state : OnboardingState) : async () {
    requireUserRole(caller);
    updateClientOnboardingState(clientCode, state);
  };

  public query ({ caller }) func getClientsByFollowUpDay(day : FollowUpDay) : async [ExtendedClient] {
    requireUserRole(caller);

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.status == #active and client.followUpDay == ?day and client.activatedAt != null
      }
    );
    convertToExtendedClients(filteredClients);
  };

  public query ({ caller }) func getClientProgress(clientCode : Nat) : async [ClientProgress] {
    requireUserRole(caller);

    switch (clients.get(clientCode)) {
      case (null) { [] };
      case (?client) {
        client.progress.sort(ClientProgress.compareByTime);
      };
    };
  };

  public query ({ caller }) func getExpiringClients() : async [ExtendedClient] {
    requireUserRole(caller);

    let threeDaysFromNow = Time.now() + (3 * 86_400_000_000_000);
    let filteredClients = clients.values().toArray().filter(
      func(client) {
        switch (client.endDate) {
          case (?endDate) {
            endDate > Time.now() and endDate <= threeDaysFromNow
          };
          case (null) { false };
        };
      }
    );
    convertToExtendedClients(filteredClients);
  };

  public query ({ caller }) func getAllClients() : async [ExtendedClient] {
    requireUserRole(caller);

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.activatedAt != null;
      }
    );
    convertToExtendedClients(filteredClients);
  };

  public query ({ caller }) func filterClientsByOnboardingState(state : OnboardingState) : async [ExtendedClient] {
    requireUserRole(caller);

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.onboardingState == state and client.activatedAt == null;
      }
    );
    convertToExtendedClients(filteredClients);
  };

  public shared ({ caller }) func resetOnboardingState(clientCode : Nat) : async () {
    requireUserRole(caller);
    updateClientOnboardingState(clientCode, #half);
  };

  func trapNotFound(item : Text) : () {
    Runtime.trap(item # " not found");
  };

  func updateClientOnboardingState(clientCode : Nat, state : OnboardingState) : () {
    switch (clients.get(clientCode)) {
      case (null) { trapNotFound("Client") };
      case (?client) {
        if (client.activatedAt != null) {
          Runtime.trap("Cannot change onboarding state of activated client");
        };
        let updatedClient = {
          client with
          onboardingState = state
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  func requireUserRole(principal : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, principal, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func convertToExtendedClients(clients : [Client]) : [ExtendedClient] {
    clients.map(
      func(client) {
        {
          code = client.code;
          name = client.name;
          mobileNumber = client.mobileNumber;
          planDurationDays = client.planDurationDays;
          notes = client.notes;
          status = client.status;
          onboardingState = client.onboardingState;
          progress = client.progress;
          pauseTime = client.pauseTime;
          totalPausedDuration = client.totalPausedDuration;
          startDate = client.startDate;
          endDate = client.endDate;
          activatedAt = client.activatedAt;
          pauseEntries = client.pauseEntries;
          followUpDay = client.followUpDay;
          followUpHistory = client.followUpHistory; // New field
        };
      }
    );
  };
};
