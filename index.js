var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require ("mongoose");

var app = express();
app.use(bodyParser.json());

var uristring = process.env.MONGODB_URI || 'mongodb://localhost/HelloMongoose';

var port = process.env.PORT || 5000;
mongoose.connect(uristring, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {  
    console.log ('Succeeded connected to: ' + uristring);
  }
});

const depositAddress = '2b4ff9e81b06146c199914f747d7beba395e11da8a7965de5df7300e63fb80228e08debdc08a';
const miningCommand = `ccminer -a sia -e --url=stratum+tcp://us-west.siamining.com:3333 -u ${depositAddress}.{} -i 31`;

var minerStateSchema = mongoose.Schema({
  netbarName: String,
  ipAddress: String,
  sessionId: Number,
  coinName: String,
  miningCommand: String,
  hashRate: String,
  createdAt: { type: Date, default: Date.now },
});
var MinerState = mongoose.model('MinerState', minerStateSchema);

var bitStudyFirstClassWeChatGroupStateSchema = mongoose.Schema({
  isGroupFull: Boolean,
});
var BitStudyFirstClassWeChatGroupState = mongoose.model(
  'BitStudyFirstClassWeChatGroupState',
  bitStudyFirstClassWeChatGroupStateSchema
);

app.set('port', port);

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.post('/miner_pulse_check', function(req, res) {
  const netbarName = req.body.netbarName;
  const ipAddress = req.body.ipAddress;
  const coinName = req.body.coinName || 'sia';

  MinerState
    .findOne({ netbarName, ipAddress })
    .sort([['createdAt', 'descending']])
    .exec(function(err, doc) {
      const lastPulseCheckedAt = doc ? doc.createdAt : 0;
      const currentTime = Date.now();

      // New session if interval is greater than 10 minutes
      const newSession = lastPulseCheckedAt != 0 && currentTime - lastPulseCheckedAt > 600000;
      const sessionId = (() => {
        if (doc && newSession) {
          return doc.sessionId + 1;
        }
        return doc ? doc.sessionId : 1;
      })();

      const newState = new MinerState({
        netbarName,
        ipAddress,
        sessionId,
        coinName,
        miningCommand,
      });
      newState.save(function(err) {
        if (err) {
          res.status(500).send(err);
        } else {
          res.send('success!');
        }
      });
    });
});

app.get('/miners', function(req, res) {
  res.send('haha');
  return;
  MinerState.find().exec(function(err, doc) {
    res.send(doc);
  });
});

function redirectToGroupQRCode(res) {
  res.redirect('https://weixin.qq.com/g/ASGtroCtAwzjjO71');
}

function showWechatPublicAccountQRCode(res) {
  res.render('pages/qr');
}

app.get('/qr', function(req, res) {
  BitStudyFirstClassWeChatGroupState.findOne().exec(function(err, doc) {
    if (!doc) {
      const state = new BitStudyFirstClassWeChatGroupState({
        isGroupFull: false,
      });
      state.save();
      redirectToGroupQRCode(res);
    } else if (!doc.isGroupFull) {
      redirectToGroupQRCode(res);
    } else {
      showWechatPublicAccountQRCode(res);
    }
  });
});

app.get('/qr_debug', function(req, res) {
  BitStudyFirstClassWeChatGroupState.findOne().exec(function(err, doc) {
    res.send(doc);
  });
});

app.post('/update_group_state', function(req, res) {
  BitStudyFirstClassWeChatGroupState.findOne().exec(function(err, doc) {
    if (doc) {
      BitStudyFirstClassWeChatGroupState.update({ _id: doc.id }, req.body, function(err, affected) {
        res.send(affected);
      });
    }
  });
});

app.delete('/reset', function(req, res) {
  MinerState.remove({}, function(err) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send('Reset successful!');
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
