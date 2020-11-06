angle{

  // combine a numeric angle with an angle unit and allow conversion between them

  angle:Angle = (measure:Number, unit:AngleUnit) => {
    Angle.new(measure, unit)
  }

  getDegrees:Number = (angle:Angle) => {
    angle.degrees()
  }

  getRadians:Number = (angle:Angle) => {
    angle.radians()
  }

  difference:Angle = (a:Angle, b:Angle) => {
    a.difference(b)
  }

}