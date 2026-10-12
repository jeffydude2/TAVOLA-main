const router = require('express').Router();
const c = require('../controllers/restaurantController');

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.get('/overview', c.overview);
router.get('/meta/cuisines', c.cuisines);
router.get('/meta/boroughs', c.boroughs);
router.get('/stats/boroughs', c.byBorough);
router.get('/stats/top-rated', c.topRated);

router.get('/restaurants', c.list);
router.post('/restaurants', c.create);
router.get('/restaurants/:id', c.getOne);
router.put('/restaurants/:id', c.update);
router.delete('/restaurants/:id', c.remove);

module.exports = router;
