control {

  trigger eachFrame (){
    locals{
      frameCount:Integer <= runtime.frameCount;
      elapsed:Float <= runtime.elapsed;
    }
    Control.eachFrame(expressions)
  }

  context repeat (){
    locals{
      index:Integer <= Loop.index;
    }
    Control.repeat(expressions)
  }

  context loopOver (list:Type[]){
    locals{
      index:Integer <= Loop.index;
      item:Type <= list[Loop.index];
    }
    Control.loopOver(expressions)
  }

  // basic access to logging
  log:Text(text:Text){
    Control.log(text)
  }

  // A note for the coder, ignored by the runtime
  comment:Text(text:Text){
    Control.comment(text)
  }

  // First boolean, but haven't implemented return values yet, so shouldn't matter?
  alert:Truth(text:Text){
    Control.alert(text)
  }
}