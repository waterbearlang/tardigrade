list {
  create:Type[](type:Type){
    list.createListOfType(type)
  }

  itemAtIndex:Type(list:Type[], index:Number){
    list.get(index)
  }

  concatenate:Type[](a:Type[], b:Type[]){
    a.concat(b)
  }

  joinWith:String(list:Type[], separator:String){
    list.join(separator)
  }

  append:List(list:List, item:Type){
    list.append(item)
  }

  prepend:List(list:List, item:Type){
    list.prepend(item);
  }

}