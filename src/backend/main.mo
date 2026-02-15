import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Apply migration from old to new state on upgrade via the with clause.

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    // Other user metadata if needed
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func isReady() : async Bool {
    true;
  };

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

  type OnboardingState = {
    #half;
    #full;
  };

  type ClientStatus = {
    #active;
    #paused;
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

  type PlanDetails = {
    planDurationDays : Nat;
    extraDays : Nat;
  };

  type Subscription = {
    planDurationDays : Nat;
    extraDays : Nat;
    startDate : Time.Time;
    endDate : Time.Time;
    createdAt : Time.Time;
  };

  type Client = {
    code : Nat;
    owner : Principal;
    name : Text;
    mobileNumber : Text;
    notes : Text;
    status : ClientStatus;
    onboardingState : OnboardingState;
    progress : [ClientProgress];
    pauseTime : ?Time.Time;
    totalPausedDuration : Int;
    pauseEntries : [PauseEntry];
    followUpDay : ?FollowUpDay;
    followUpHistory : [FollowUpEntry];
    subscriptions : [Subscription];
    activatedAt : ?Time.Time;
    initialPlanDetails : ?PlanDetails;
  };

  module Client {
    public func compareByPlanEndDate(x : Client, y : Client) : Order.Order {
      switch (getCurrentEndDate(x), getCurrentEndDate(y)) {
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
    public func getCurrentSubscription(client : Client) : ?Subscription {
      if (client.subscriptions.size() == 0) { return null };
      let now = Time.now();
      let activeSubscriptions = client.subscriptions.filter(
        func(sub) {
          now >= sub.startDate and now <= sub.endDate
        }
      );
      if (activeSubscriptions.size() > 0) {
        ?activeSubscriptions[activeSubscriptions.size() - 1];
      } else {
        ?client.subscriptions[client.subscriptions.size() - 1];
      };
    };
    public func getCurrentEndDate(client : Client) : ?Time.Time {
      switch (getCurrentSubscription(client)) {
        case (?sub) { ?sub.endDate };
        case (null) { null };
      };
    };
  };

  type ExtendedClient = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    notes : Text;
    status : ClientStatus;
    onboardingState : OnboardingState;
    progress : [ClientProgress];
    pauseTime : ?Time.Time;
    totalPausedDuration : Int;
    pauseEntries : [PauseEntry];
    followUpDay : ?FollowUpDay;
    followUpHistory : [FollowUpEntry];
    subscriptions : [Subscription];
    activatedAt : ?Time.Time;
    initialPlanDetails : ?PlanDetails;
  };

  public type ClientSummary = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    status : ClientStatus;
    onboardingState : OnboardingState;
    pauseTime : ?Time.Time;
    followUpDay : ?FollowUpDay;
    subscriptionSummary : ?SubscriptionSummary;
    activatedAt : ?Time.Time;
  };

  public type SubscriptionSummary = {
    planDurationDays : Nat;
    extraDays : Nat;
    startDate : Time.Time;
    endDate : Time.Time;
  };

  public type AppInitData = {
    clientSummaries : [ClientSummary];
    userProfile : ?UserProfile;
  };

  var clientCodeCounter = 1;

  let clients = Map.empty<Nat, Client>();

  public shared ({ caller }) func createClient(
    name : Text,
    mobileNumber : Text,
    notes : Text,
    initialOnboardingState : OnboardingState,
    planDurationDays : Nat,
    extraDays : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create clients");
    };

    let clientCode = clientCodeCounter;
    clientCodeCounter += 1;

    let newClient : Client = {
      code = clientCode;
      owner = caller;
      name;
      mobileNumber;
      notes;
      status = #active;
      onboardingState = initialOnboardingState;
      progress = [];
      pauseTime = null;
      totalPausedDuration = 0;
      pauseEntries = [];
      followUpDay = null;
      followUpHistory = [];
      subscriptions = [];
      activatedAt = null;
      initialPlanDetails = ?{ planDurationDays; extraDays };
    };

    clients.add(clientCode, newClient);
    clientCode;
  };

  public shared ({ caller }) func createOrRenewSubscription(
    clientCode : Nat,
    planDurationDays : Nat,
    extraDays : Nat,
    startDate : Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage subscriptions");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

        if (client.onboardingState != #full) {
          Runtime.trap("Cannot activate client: must complete all onboarding steps first.");
        };

        let endDate = startDate + ((planDurationDays + extraDays) * 86_400_000_000_000 : Int);
        let newSubscription : Subscription = {
          planDurationDays;
          extraDays;
          startDate;
          endDate;
          createdAt = Time.now();
        };

        let updatedClient = {
          client with
          status = #active;
          subscriptions = client.subscriptions.concat([newSubscription]);
          activatedAt = ?Time.now();
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public shared ({ caller }) func expireMembershipImmediately(clientCode : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can expire memberships");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

        let updatedSubscriptions = client.subscriptions.map(
          func(subscription) {
            if (
              switch (client.activatedAt) {
                case (?timestamp) {
                  subscription.endDate > timestamp
                };
                case (null) { false };
              }
            ) {
              { subscription with endDate = Time.now() };
            } else {
              subscription;
            };
          }
        );

        let updatedClient = {
          client with
          subscriptions = updatedSubscriptions;
          status = #active;
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public query ({ caller }) func getCurrentSubscription(clientCode : Nat) : async ?SubscriptionSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view subscriptions");
    };

    switch (clients.get(clientCode)) {
      case (null) { null };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only view your own clients");
        };

        let currentSubscription = Client.getCurrentSubscription(client);
        currentSubscription.map(func(subscription) {
          {
            planDurationDays = subscription.planDurationDays;
            extraDays = subscription.extraDays;
            startDate = subscription.startDate;
            endDate = subscription.endDate;
          };
        });
      };
    };
  };

  public shared ({ caller }) func setFollowUpDay(clientCode : Nat, followUpDay : FollowUpDay) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set follow-up days");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record follow-ups");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view follow-up history");
    };

    switch (clients.get(clientCode)) {
      case (null) { [] };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only view your own clients");
        };
        client.followUpHistory;
      };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add progress");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can pause clients");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can resume clients");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

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
              pauseEntries = updatedPauseEntries;
              subscriptions = client.subscriptions.map(
                func(sub) {
                  {
                    sub with
                    endDate = sub.endDate + pausedDuration
                  };
                }
              );
            };
            clients.add(clientCode, updatedClient);
          };
          case (_) { Runtime.trap("Client is not currently paused ") };
        };
      };
    };
  };

  public shared ({ caller }) func updateOnboardingState(clientCode : Nat, state : OnboardingState) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update onboarding state");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

        if (client.activatedAt != null) {
          Runtime.trap("Cannot update onboarding state for activated clients");
        };

        let updatedClient = {
          client with
          onboardingState = state
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public shared ({ caller }) func convertToFullOnboarding(clientCode : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can convert onboarding state");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

        if (client.activatedAt != null) {
          Runtime.trap("Cannot update onboarding state for activated clients");
        };

        let updatedClient = {
          client with
          onboardingState = #full
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public query ({ caller }) func getClientsByFollowUpDay(day : FollowUpDay) : async [ExtendedClient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let userClients = clients.values().toArray().filter(
      func(client) {
        client.owner == caller and client.status == #active and client.followUpDay == ?day and client.activatedAt != null
      }
    );
    convertToExtendedClients(userClients);
  };

  public query ({ caller }) func getClientProgress(clientCode : Nat) : async [ClientProgress] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view progress");
    };

    switch (clients.get(clientCode)) {
      case (null) { [] };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only view your own clients");
        };
        client.progress.sort(ClientProgress.compareByTime);
      };
    };
  };

  public query ({ caller }) func getExpiringClients() : async [ExtendedClient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let tenDaysFromNow = Time.now() + (10 * 86_400_000_000_000 : Int);

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.owner == caller and switchByStatus(Client.getCurrentEndDate(client), client.activatedAt, client.status);
      }
    );
    convertToExtendedClients(filteredClients);
  };

  public query ({ caller }) func getAllClients() : async [ExtendedClient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let filteredClients = clients.values().toArray().filter(
      func(client) { client.owner == caller and client.activatedAt != null }
    );
    convertToExtendedClients(filteredClients);
  };

  public query ({ caller }) func filterClientsByOnboardingState(state : OnboardingState) : async [ExtendedClient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.owner == caller and client.onboardingState == state and client.activatedAt == null
      }
    );
    convertToExtendedClients(filteredClients);
  };

  public shared ({ caller }) func resetOnboardingState(clientCode : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reset onboarding state");
    };

    switch (clients.get(clientCode)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only manage your own clients");
        };

        if (client.activatedAt != null) {
          Runtime.trap("Cannot reset onboarding state for activated clients");
        };

        let updatedClient = {
          client with
          onboardingState = #half
        };
        clients.add(clientCode, updatedClient);
      };
    };
  };

  public query ({ caller }) func getClientByCode(clientCode : Nat) : async ?ExtendedClient {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    switch (clients.get(clientCode)) {
      case (null) { null };
      case (?client) {
        if (client.owner != caller) {
          Runtime.trap("Unauthorized: You can only view your own clients");
        };
        ?convertToExtendedClient(client);
      };
    };
  };

  public query ({ caller }) func getAllClientsAndNonActivatedClients() : async {
    activatedClients : [ExtendedClient];
    halfOnboardedClients : [ExtendedClient];
    fullOnboardedClients : [ExtendedClient];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let allClients = clients.values().toArray().filter(
      func(client) { client.owner == caller }
    );

    let activated = allClients.filter(
      func(client) { client.activatedAt != null }
    );

    let halfOnboarded = allClients.filter(
      func(client) { client.onboardingState == #half and client.activatedAt == null }
    );

    let fullOnboarded = allClients.filter(
      func(client) { client.onboardingState == #full and client.activatedAt == null }
    );

    {
      activatedClients = convertToExtendedClients(activated);
      halfOnboardedClients = convertToExtendedClients(halfOnboarded);
      fullOnboardedClients = convertToExtendedClients(fullOnboarded);
    };
  };

  public query ({ caller }) func getClientSummaries() : async [ClientSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let filteredClients = clients.values().toArray().filter(
      func(client) {
        client.owner == caller and client.activatedAt != null
      }
    );
    convertToClientSummaries(filteredClients);
  };

  public query ({ caller }) func getActivatedClientSummaries() : async [ClientSummary] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let filteredClients = clients.values().toArray().filter(
      func(client) { client.owner == caller and client.activatedAt != null }
    );
    convertToClientSummaries(filteredClients);
  };

  public query ({ caller }) func getNonActivatedClientSummaries() : async {
    halfOnboardedClients : [ClientSummary];
    fullOnboardedClients : [ClientSummary];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clients");
    };

    let allClients = clients.values().toArray().filter(
      func(client) { client.owner == caller }
    );

    let halfOnboarded = allClients.filter(
      func(client) { client.onboardingState == #half and client.activatedAt == null }
    );

    let fullOnboarded = allClients.filter(
      func(client) { client.onboardingState == #full and client.activatedAt == null }
    );

    {
      halfOnboardedClients = convertToClientSummaries(halfOnboarded);
      fullOnboardedClients = convertToClientSummaries(fullOnboarded);
    };
  };

  public query ({ caller }) func getAppInitData() : async AppInitData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access app data");
    };

    let userClients = clients.values().toArray().filter(
      func(client) { client.owner == caller }
    );

    let clientSummaries = userClients.map(
      func(client) { convertToClientSummary(client) }
    );
    let userProfile = userProfiles.get(caller);
    { clientSummaries; userProfile };
  };

  func switchByStatus(result : ?Time.Time, activatedAt : ?Time.Time, status : ClientStatus) : Bool {
    let tenDaysFromNow = Time.now() + (10 * 86_400_000_000_000 : Int);
    switch (result, activatedAt, status) {
      case (?endDate, ?_, #active) {
        endDate > Time.now() and endDate <= tenDaysFromNow
      };
      case (_, _, _) { false };
    };
  };

  func convertToExtendedClient(client : Client) : ExtendedClient {
    {
      code = client.code;
      name = client.name;
      mobileNumber = client.mobileNumber;
      notes = client.notes;
      status = client.status;
      onboardingState = client.onboardingState;
      progress = client.progress;
      pauseTime = client.pauseTime;
      totalPausedDuration = client.totalPausedDuration;
      pauseEntries = client.pauseEntries;
      followUpDay = client.followUpDay;
      followUpHistory = client.followUpHistory;
      subscriptions = client.subscriptions;
      activatedAt = client.activatedAt;
      initialPlanDetails = client.initialPlanDetails;
    };
  };

  func convertToExtendedClients(clients : [Client]) : [ExtendedClient] {
    clients.map(
      func(client) { convertToExtendedClient(client) }
    );
  };

  func convertToClientSummaries(clients : [Client]) : [ClientSummary] {
    clients.map(func(client) { convertToClientSummary(client) });
  };

  func convertToClientSummary(client : Client) : ClientSummary {
    {
      code = client.code;
      name = client.name;
      mobileNumber = client.mobileNumber;
      status = client.status;
      onboardingState = client.onboardingState;
      pauseTime = client.pauseTime;
      followUpDay = client.followUpDay;
      subscriptionSummary = Client.getCurrentSubscription(client).map(func(sub) {
        {
          planDurationDays = sub.planDurationDays;
          extraDays = sub.extraDays;
          startDate = sub.startDate;
          endDate = sub.endDate;
        };
      });
      activatedAt = client.activatedAt;
    };
  };
};
