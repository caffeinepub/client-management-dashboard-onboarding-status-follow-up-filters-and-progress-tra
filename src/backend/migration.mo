import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

module {
  public type OldPauseEntry = {
    timestamp : Int;
    durationDays : Nat;
    reason : Text;
    resumed : Bool;
  };

  public type OldFollowUpEntry = {
    timestamp : Int;
    done : Bool;
    notes : Text;
    followUpDay : { #monday; #tuesday; #wednesday; #thursday; #friday; #saturday; #sunday };
  };

  public type OldSubscription = {
    planDurationDays : Nat;
    extraDays : Nat;
    startDate : Int;
    endDate : Int;
    createdAt : Int;
  };

  public type OldClient = {
    code : Nat;
    name : Text;
    mobileNumber : Text;
    notes : Text;
    status : { #active; #paused };
    onboardingState : { #half; #full };
    progress : [{
      timestamp : Int;
      weightKg : Float;
      neckInch : Float;
      chestInch : Float;
      waistInch : Float;
      hipsInch : Float;
      thighInch : Float;
    }];
    pauseTime : ?Int;
    totalPausedDuration : Int;
    pauseEntries : [OldPauseEntry];
    followUpDay : ?{ #monday; #tuesday; #wednesday; #thursday; #friday; #saturday; #sunday };
    followUpHistory : [OldFollowUpEntry];
    subscriptions : [OldSubscription];
    activatedAt : ?Int;
  };

  public type NewClient = {
    code : Nat;
    owner : Principal;
    name : Text;
    mobileNumber : Text;
    notes : Text;
    status : { #active; #paused };
    onboardingState : { #half; #full };
    progress : [{
      timestamp : Int;
      weightKg : Float;
      neckInch : Float;
      chestInch : Float;
      waistInch : Float;
      hipsInch : Float;
      thighInch : Float;
    }];
    pauseTime : ?Int;
    totalPausedDuration : Int;
    pauseEntries : [OldPauseEntry];
    followUpDay : ?{ #monday; #tuesday; #wednesday; #thursday; #friday; #saturday; #sunday };
    followUpHistory : [OldFollowUpEntry];
    subscriptions : [OldSubscription];
    activatedAt : ?Int;
    initialPlanDetails : ?{
      planDurationDays : Nat;
      extraDays : Nat;
    };
  };

  type OldActor = {
    clients : Map.Map<Nat, OldClient>;
    clientCodeCounter : Nat;
  };

  type NewActor = {
    clients : Map.Map<Nat, NewClient>;
    clientCodeCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newClients = old.clients.map<Nat, OldClient, NewClient>(
      func(_code, oldClient) {
        {
          oldClient with
          owner = Principal.anonymous();
          initialPlanDetails = null;
        };
      }
    );
    {
      clients = newClients;
      clientCodeCounter = old.clientCodeCounter;
    };
  };
};
