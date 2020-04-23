const mongoose = require('mongoose');

const Pay = mongoose.model('Pay', {
	amount: { type: Number },
	offer: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Offer'
	},
	account: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	created: {
		type: Date,
		default: Date.now
	}
});

module.exports = Pay;
