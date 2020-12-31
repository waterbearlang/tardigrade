angle{

  // combine a numeric angle with an angle unit and allow conversion between them

  angle:Angle(measure:Float, unit:AngleUnit){
    Angle.new(measure, unit)
  }

  getDegrees:Float(angle:Angle){
    angle.degrees()
  }

  getRadians:Float(angle:Angle){
    angle.radians()
  }

  difference:Angle(a:Angle, b:Angle){
    a.difference(b)
  }

}