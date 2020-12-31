sprite{

  spriteFrom:Sprite(images:Image[]){
    Sprite.spriteFromImages(images)
  }

  copy:Sprite(sprite:Sprite){
    sprite.copy()
  }

  accelerate:Sprite(sprite:Sprite, by:Vector){
    sprite.accelerateBy(vector)
  }

  setVelocityFor:Sprite(sprite:Sprite, to:Vector){
    sprite.setVelocityTo(vector)
  }

  getVelocityOf:Vector(sprite:Sprite){
    sprite.getVelocity()
  }

  getSpeedOf:Vector(sprite:Sprite){
    sprite.getSpeed()
  }

  getPositionOf:Vector(sprite:Sprite){
    sprite.getPosition()
  }

  getAngleOf:Angle(sprite:Sprite){
    sprite.angle()
  }

  rotate:Sprite(sprite:Sprite, by:Angle){
    sprite.rotateBy(angle)
  }

  rotate:Sprite(to:Sprite){
    sprite.rotateTo(angle)
  }

  move:Sprite(sprite:Sprite){
    sprite.move()
  }

  // should return a list of sprites
  moveAll:Sprite[](){
    Sprite.moveAll()
  }

  moveTo:Sprite(sprite:Sprite, position:Vector){
    sprite.moveTo(position)
  }

  draw:Sprite(sprite:Sprite){
    sprite.draw()
  }

  // should return a list of sprites that were drawn (not hidden or offstage)
  drawAll:Sprite(){
    Sprite.drawAll()
  }

  hide:Sprite(sprite:Sprite){
    sprite.hide()
  }

  show:Sprite(sprite:Sprite){
    sprite.show()
  }

  isHidden:Truth(sprite:Sprite){
    sprite.isHidden()
  }

  isOnstage:Truth(sprite:Sprite){
    sprite.isOnstage()
  }

  isVisible:Truth(sprite:Sprite){
    sprite.isVisible()
  }

  applyForce:Sprite(sprite:Sprite, force:Vector){
    sprite.applyForce(force)
  }

  setEdgeBehavior:Sprite(sprite:Sprite, behavior:EdgeChoice){
    sprite.setEdgeBehavior(behavior)
  }

  areColliding:Truth(a:Sprite, b:Sprite){
    a.collidingWithSprite(b)
  }

  areColliding:Truth(a:Sprite, b:Shape){
    a.collidingWithShape(b)
  }


}