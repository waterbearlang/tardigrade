control {
  
  log:String = (string:String) => {
    Control.log(string)
  }

  comment:String = (string:String) => {
    Control.comment(string)
  }

  alert:Boolean = (string:String) => {
    Control.alert(string);
  }
}