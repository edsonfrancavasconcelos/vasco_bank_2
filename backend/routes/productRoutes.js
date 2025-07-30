const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  listProducts,
  requestProduct
} = require('../controllers/productController');

router.get('/', auth, listProducts);
router.post('/request', auth, requestProduct);

module.exports = router;
