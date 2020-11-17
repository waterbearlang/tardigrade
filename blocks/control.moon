control {

  // basic access to logging
  log:Text(string:Text){
    Control.log(string)
  }

  // A note for the coder, ignored by the runtime
  comment:Text(string:Text){
    Control.comment(string)
  }

  // First boolean, but haven't implemented return values yet, so shouldn't matter?
  alert:Truth(string:Text){
    Control.alert(string)
  }
}