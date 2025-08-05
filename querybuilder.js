const opFns = {
  '=': (qb, field, value) => qb.where(field, '=', value),
  '!=': (qb, field, value) => qb.where(field, '<>', value),
  '>': (qb, field, value) => qb.where(field, '>', value),
  '<': (qb, field, value) => qb.where(field, '<', value),
  '>=': (qb, field, value) => qb.where(field, '>=', value),
  '<=': (qb, field, value) => qb.where(field, '<=', value),
};

function applyRule(qb, rule) {
  if (rule.op === 'AND' || rule.op === 'OR') {
    const method = rule.op === 'AND' ? 'andWhere' : 'orWhere';
    qb[method](subQb => {
      rule.rules.forEach(r => applyRule(subQb, r));
    });
  } else {
    const fn = opFns[rule.op];
    if (!fn) throw new Error(`Unsupported operator: ${rule.op}`);
    fn(qb, rule.field, rule.value);
  }
}

module.exports = {
  applyRule
};

