const activity = require('../models').activity
const action = require('../models').action
const actionTrigger = require('../models').actionTrigger
const viewport = require('../models').viewport
const device = require('../models').device
const poi = require('../models').poi
const primitive = require('../models').primitive
const place = require('../models').place
const author = require('../models').author
const workplace = require('../models').workplace
const validationMiddleware = require('../helpers/validationMiddleware')
const validationRules = require('../helpers/validationRules')

module.exports = (app) => {
  app.get('/api/activity', validationMiddleware.validate(), (req, res) => {
    activity.findAll({ include: [action, author, workplace], order: [['id', 'DESC']] }).then((objects) => {
      if (objects === null) {
        res.json([])
      } else {
        res.json(objects)
      }
    })
  })

  app.get('/api/activity/:id', validationMiddleware.validate(), async (req, res) => {
    const object = await activity.find({where: {id: req.params.id}, include: [{model: author}, {model: action, include: [{model: device}, {model: place}, {model: primitive}, {model: viewport}, {model: actionTrigger, include: [viewport, primitive, poi]}]}]})
    if (object === null) {
      res.status(401).json({ messages: 'Activity does not exists' })
    } else {
      for (var i = 0; i < object.actions.length; i++) {
        for (var j = 0; j < object.actions[i].actionTriggers.length; j++) {
          if (object.actions[i].actionTriggers[j].entityId !== null && object.actions[i].actionTriggers[j].entityType != null) {
            object.actions[i].actionTriggers[j].entityType = await require('../models')[object.actions[i].actionTriggers[j].entityType].find({where: {id: object.actions[i].actionTriggers[j].entityId}})
          }
        }
      }
      res.json(object)
    }
  })

  app.post('/api/activity', validationMiddleware.validate(validationRules.activity), (req, res) => {
    activity.create({
      name: req.body.name,
      workplaceId: req.body.workplace,
      language: req.body.language,
      description: req.body.description,
      authorId: req.author.id
    }).then(async (object) => {
      if (object === null) {
        res.json([])
      } else {
        if (req.body.actions.length > 0) {
          for (var i = 0; i < req.body.actions.length; i++) {
            var actionObject = await action.create({
              name: req.body.actions[i].name,
              type: req.body.actions[i].type,
              viewportId: req.body.actions[i].viewport,
              deviceId: req.body.actions[i].device,
              placeId: req.body.actions[i].place,
              primitiveId: req.body.actions[i].primitive,
              instructionTitle: req.body.actions[i].instructionTitle,
              instructionDescription: req.body.actions[i].instructionDescription,
              activityId: object.id
            })
            if (i === 0) {
              await object.updateAttributes({
                start: actionObject.id
              })
            }
            if (req.body.actions[i].triggers.length > 0) {
              for (var j = 0; j < req.body.actions[i].triggers.length; j++) {
                await actionTrigger.create({
                  actionId: actionObject.id,
                  mode: req.body.actions[i].triggers[j].mode,
                  removeSelf: req.body.actions[i].triggers[j].removeSelf,
                  operation: req.body.actions[i].triggers[j].operation,
                  entityType: req.body.actions[i].triggers[j].entityType,
                  entityId: req.body.actions[i].triggers[j].entityId,
                  poi: req.body.actions[i].triggers[j].poi,
                  viewportId: req.body.actions[i].triggers[j].viewportId,
                  primitiveId: req.body.actions[i].triggers[j].predicateId,
                  option: req.body.actions[i].triggers[j].option
                })
              }
            }
          }
        }
        res.json(object)
      }
    })
  })

  app.put('/api/activity/:id', validationMiddleware.validate(validationRules.activity), (req, res) => {
    activity.find({where: {id: req.params.id}}).then((object) => {
      if (object !== null) {
        object.updateAttributes({
          name: req.body.name,
          workplaceId: req.body.workplace,
          language: req.body.language,
          description: req.body.description,
          authorId: req.author.id
        }).then(async (innerObject) => {
          if (innerObject === null) {
            res.json([])
          } else {
            action.destroy({where: {activityId: object.id}})
            if (req.body.actions.length > 0) {
              for (var i = 0; i < req.body.actions.length; i++) {
                var actionObject = await action.create({
                  name: req.body.actions[i].name,
                  type: req.body.actions[i].type,
                  viewportId: req.body.actions[i].viewport,
                  deviceId: req.body.actions[i].device,
                  placeId: req.body.actions[i].place,
                  primitiveId: req.body.actions[i].primitive,
                  instructionTitle: req.body.actions[i].instructionTitle,
                  instructionDescription: req.body.actions[i].instructionDescription,
                  activityId: object.id
                })
                if (i === 0) {
                  await object.updateAttributes({
                    start: actionObject.id
                  })
                }
                if (req.body.actions[i].triggers.length > 0) {
                  actionTrigger.destroy({where: {actionId: actionObject.id}})
                  for (var j = 0; j < req.body.actions[i].triggers.length; j++) {
                    await actionTrigger.create({
                      actionId: actionObject.id,
                      mode: req.body.actions[i].triggers[j].mode,
                      removeSelf: req.body.actions[i].triggers[j].removeSelf,
                      operation: req.body.actions[i].triggers[j].operation,
                      entityType: req.body.actions[i].triggers[j].entityType,
                      entityId: req.body.actions[i].triggers[j].entityId,
                      poi: req.body.actions[i].triggers[j].poi,
                      viewportId: req.body.actions[i].triggers[j].viewportId,
                      primitiveId: req.body.actions[i].triggers[j].predicateId,
                      option: req.body.actions[i].triggers[j].option
                    })
                  }
                }
              }
            }
            res.json(object)
          }
        })
      } else {
        res.status(401).json({ messages: 'Activity does not exists' })
      }
    })
  })

  app.delete('/api/activity/:id', validationMiddleware.validate(), (req, res) => {
    activity.find({where: {id: req.params.id}}).then((object) => {
      if (object !== null) {
        object.destroy().then((innerObject) => {
          if (innerObject !== null) {
            res.status(200).json({ messages: 'Activity has been deleted successfully' })
          } else {
            res.status(500).json({ messages: 'An unexpected error occured' })
          }
        })
      } else {
        res.status(401).json({ messages: 'Activity does not exists' })
      }
    })
  })
}