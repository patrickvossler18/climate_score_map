// Taken from Development Seed's dirty-reprojectors repo https://github.com/developmentseed/dirty-reprojectors
// MIT License

function reproject (options, geometry) {
  let streams = []

  if (options.forward) {
    let proj = options.forward
    if (typeof proj === 'string') {
      proj = options.projections[proj]
    }
    streams.push(proj.stream, flipY())
  }

  if (options.reverse) {
    let proj = options.reverse
    if (typeof proj === 'string') {
      proj = options.projections[proj]
    }
    streams.push(reverse(proj), flipY())
  }

  streams.reverse()

  const projection = {
    stream: function (output) {
      return streams.reduce((combined, s) => s(combined), output)
    }
  }

  return d3.geoProject(geometry, projection)
}

function reverse (projection) {
  let prev = []
  return d3.geoTransform({
    point: function (x, y) {
      // prevent wrapping due to precision issues
      x = clamp(x, -20037508.34278924, 20037508.34278924)
      var reversed = projection.invert([x, y])

      // drop points that fail to project or are identical to the previous
      // point
      if (!reversed || (reversed[0] === prev[0] && reversed[1] === prev[1])) {
        return
      }

      prev = reversed
      this.stream.point(reversed[0], reversed[1])
    }
  }).stream
};

function flipY () {
  return d3.geoTransform({
    point: function (x, y) {
      this.stream.point(x, -y)
    }
  }).stream
}

function clamp (value, min, max) {
  if (value > max) {
    return max
  } else if (value < min) {
    return min
  } else {
    return value
  }
};

