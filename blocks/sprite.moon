sprite{

  // Update parser to accept list notation Image[]
  spriteFromImages:Sprite = (images:Image) => {
    Sprite.spriteFromImages(images)
  }

  copy:Sprite = (sprite:Sprite) => {
    sprite.copy()
  }

  accelerateBy:Sprite = (sprite:Sprite, vector:Vector) => {
    sprite.accelerateBy(vector)
  }

  setVelocityTo:Sprite = (sprite:Sprite, vector:Vector) => {
    sprite.setVelocityTo(vector)
  }

  getVelocity:Vector = (sprite:Sprite) => {
    sprite.getVelocity()
  }

  getSpeed:Vector = (sprite:Sprite) => {
    sprite.getSpeed()
  }

  getPosition:Vector = (sprite:Sprite) => {
    sprite.getPosition()
  }

  getAngle:Angle = (sprite:Sprite) => {
    sprite.angle()
  }

  rotateBy:Sprite = (sprite:Sprite, angle:Angle) => {
    sprite.rotateBy(angle)
  }

  rotateTo:Sprite = (sprite:Sprite) => {
    sprite.rotateTo(angle)
  }

  move:Sprite = (sprite:Sprite) => {
    sprite.move()
  }

  // should return a list of sprites
  moveAll:Sprite = () => {
    Sprite.moveAll()
  }

  moveTo:Sprite = (sprite:Sprite, position:Vector) => {
    sprite.moveTo(position)
  }

  draw:Sprite = (sprite:Sprite) => {
    sprite.draw()
  }

  // should return a list of sprites that were drawn (not hidden or offstage)
  drawAll:Sprite = () => {
    Sprite.drawAll()
  }

  hide:Sprite = (sprite:Sprite) => {
    sprite.hide()
  }

  show:Sprite = (sprite:Sprite) => {
    sprite.show()
  }

  isHidden:Truth = (sprite:Sprite) => {
    sprite.isHidden()
  }

  isOnstage:Truth = (sprite:Sprite) => {
    sprite.isOnstage()
  }

  isVisible:Truth = (sprite:Sprite) => {
    sprite.isVisible()
  }

  applyForce:Sprite = (sprite:Sprite, force:Vector) => {
    sprite.applyForce(force)
  }

  setEdgeBehavior:Sprite = (sprite:Sprite, behavior:edgeChoice) => {
    sprite.setEdgeBehavior(behavior)
  }

  areColliding:Truth = (a:Sprite, b:Sprite) => {
    a.collidingWithSprite(b)
  }

  areColliding:Truth = (a:Sprite, b:Shape) => {
    a.collidingWithShape(b)
  }


}