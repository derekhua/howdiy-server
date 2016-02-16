var decodeBase64Image = function(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }
  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  
  return response;
};

var isBase64String = function(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};
  if (matches === null) {
    return false;
  }
  else if (matches.length !== 3) {
    return false;
  }
  return true;
}

module.exports.decodeBase64Image = decodeBase64Image;
module.exports.isBase64String = isBase64String;