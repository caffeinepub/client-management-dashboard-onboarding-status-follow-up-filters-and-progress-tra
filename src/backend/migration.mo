import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type OldClient = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    planDurationDays : Nat;
    notes : Text;
    status : {
      #active;
      #paused;
    };
    onboardingState : {
      #half;
      #full;
    };
    progress : [OldClientProgress];
    pauseTime : ?Time.Time;
    totalPausedDuration : Int;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    activatedAt : ?Time.Time;
    pauseEntries : [OldPauseEntry];
    followUpDay : ?{
      #monday;
      #tuesday;
      #wednesday;
      #thursday;
      #friday;
      #saturday;
      #sunday;
    };
  };

  type OldClientProgress = {
    weightKg : Float;
    neckInch : Float;
    chestInch : Float;
    waistInch : Float;
    hipsInch : Float;
    thighInch : Float;
    timestamp : Time.Time;
  };

  type OldPauseEntry = {
    timestamp : Time.Time;
    durationDays : Nat;
    reason : Text;
    resumed : Bool;
  };

  type FollowUpEntry = {
    timestamp : Time.Time;
    done : Bool;
    notes : Text;
    followUpDay : {
      #monday;
      #tuesday;
      #wednesday;
      #thursday;
      #friday;
      #saturday;
      #sunday;
    };
  };

  type NewClient = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    planDurationDays : Nat;
    notes : Text;
    status : {
      #active;
      #paused;
    };
    onboardingState : {
      #half;
      #full;
    };
    progress : [OldClientProgress];
    pauseTime : ?Time.Time;
    totalPausedDuration : Int;
    startDate : ?Time.Time;
    endDate : ?Time.Time;
    activatedAt : ?Time.Time;
    pauseEntries : [OldPauseEntry];
    followUpDay : ?{
      #monday;
      #tuesday;
      #wednesday;
      #thursday;
      #friday;
      #saturday;
      #sunday;
    };
    followUpHistory : [FollowUpEntry];
  };

  type OldActor = {
    clients : Map.Map<Nat, OldClient>;
    clientCodeCounter : Nat;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  type NewActor = {
    clients : Map.Map<Nat, NewClient>;
    clientCodeCounter : Nat;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    let newClients = old.clients.map<Nat, OldClient, NewClient>(
      func(_code, oldClient) {
        {
          oldClient with
          followUpHistory = [];
        };
      }
    );
    {
      old with
      clients = newClients;
    };
  };
};
