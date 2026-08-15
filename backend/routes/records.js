const express = require("express");
const { sfRequest } = require("../salesforceClient");
const fieldsConfig = require("../fieldsConfig");

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.sfAuth) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function requireValidObject(req, res, next) {
  if (!fieldsConfig[req.params.object]) {
    return res.status(400).json({ error: `Unsupported object: ${req.params.object}` });
  }
  next();
}

router.use(requireAuth);

// GET the curated field list for the object, enriched with label/type/picklist
// values from Salesforce's describe API so the UI can render an appropriate
// input for each field.
router.get("/fields/:object", requireValidObject, async (req, res, next) => {
  try {
    const { object } = req.params;
    const config = fieldsConfig[object];

    const describeData = await sfRequest(req, res, { method: "GET", path: `/sobjects/${object}/describe` });
    const describeByName = Object.fromEntries(describeData.fields.map((f) => [f.name, f]));

    const fields = config.fields.map((apiName) => {
      const meta = describeByName[apiName] || {};
      let inputType = "text";
      if (meta.type === "boolean") inputType = "checkbox";
      else if (meta.type === "date") inputType = "date";
      else if (meta.type === "datetime") inputType = "datetime-local";
      else if (["double", "currency", "int", "percent"].includes(meta.type)) inputType = "number";
      else if (meta.type === "textarea") inputType = "textarea";
      else if (meta.type === "picklist") inputType = "select";

      return {
        apiName,
        label: meta.label || apiName,
        inputType,
        required: meta.nillable === false && meta.defaultedOnCreate === false && meta.createable,
        updateable: meta.updateable !== false,
        picklistValues: meta.type === "picklist" ? (meta.picklistValues || []).filter((p) => p.active).map((p) => p.value) : undefined,
      };
    });

    res.json({ object, displayField: config.displayField, fields });
  } catch (err) {
    next(err);
  }
});

// GET a page of records. Uses SOQL LIMIT/OFFSET so the frontend can request
// 20 records at a time as the user scrolls.
router.get("/records/:object", requireValidObject, async (req, res, next) => {
  try {
    const { object } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const config = fieldsConfig[object];

    const soql = `SELECT Id, ${config.fields.join(", ")} FROM ${object} ORDER BY ${config.orderBy} LIMIT ${limit} OFFSET ${offset}`;
    const data = await sfRequest(req, res, { method: "GET", path: "/query", params: { q: soql } });

    res.json({
      records: data.records.map(({ attributes, ...rest }) => rest),
      totalSize: data.totalSize,
      hasMore: offset + data.records.length < data.totalSize,
      nextOffset: offset + limit,
    });
  } catch (err) {
    next(err);
  }
});

// CREATE
router.post("/records/:object", requireValidObject, async (req, res, next) => {
  try {
    const { object } = req.params;
    const data = await sfRequest(req, res, { method: "POST", path: `/sobjects/${object}`, data: req.body });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.patch("/records/:object/:id", requireValidObject, async (req, res, next) => {
  try {
    const { object, id } = req.params;
    await sfRequest(req, res, { method: "PATCH", path: `/sobjects/${object}/${id}`, data: req.body });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/records/:object/:id", requireValidObject, async (req, res, next) => {
  try {
    const { object, id } = req.params;
    await sfRequest(req, res, { method: "DELETE", path: `/sobjects/${object}/${id}` });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
