// Unified Logistics Hub - Automated HS Code Validator & Compliance Engine

class HSCodeValidator {
  constructor(database) {
    this.db = database || window.HUB_DATA.HS_RULES_DATABASE;
  }

  validate(hsCodeStr, goodsDescription = '') {
    // Clean input
    const cleanCode = (hsCodeStr || '').replace(/[^0-9]/g, '');

    const result = {
      rawInput: hsCodeStr,
      cleanCode: cleanCode,
      isValidStructure: false,
      isExactMatch: false,
      riskLevel: 'low', // low | medium | high | critical
      matchedRule: null,
      issues: [],
      recommendations: [],
      dutyEstimate: null
    };

    // 1. Structure Check
    if (cleanCode.length === 8 || cleanCode.length === 10) {
      result.isValidStructure = true;
    } else {
      result.issues.push({
        severity: 'critical',
        code: 'ERR_LENGTH',
        message: `Invalid HS Code length (${cleanCode.length} digits). Standard BTKI code must be 8 or 10 digits.`
      });
      result.riskLevel = 'critical';
      result.recommendations.push('Re-verify document HS Code against BTKI 2022 tariff book.');
    }

    // 2. Exact Match in Rules DB
    const formattedDotted = this.formatDotted(cleanCode);
    const rule = this.db.find(r => r.code.replace(/[^0-9]/g, '') === cleanCode);

    if (rule) {
      result.isExactMatch = true;
      result.matchedRule = rule;
      result.dutyEstimate = { bm: rule.bm, ppn: rule.ppn, pph: rule.pph };

      // 3. LARTAS / Restriction Check
      if (rule.lartas) {
        result.riskLevel = result.riskLevel === 'critical' ? 'critical' : 'high';
        result.issues.push({
          severity: 'warning',
          code: 'WARN_LARTAS',
          message: `Restricted Commodity (LARTAS). Requires mandatory import permit: ${rule.permitReq || 'Special Permit Required'}.`
        });
        result.recommendations.push(`Upload valid ${rule.permitReq} permit before committing PIB.`);
      }
    } else if (result.isValidStructure) {
      result.issues.push({
        severity: 'warning',
        code: 'WARN_NOT_IN_LOCAL_DB',
        message: 'HS Code format valid, but specific sub-heading requires customs officer verification.'
      });
      result.riskLevel = 'medium';
      result.recommendations.push('Check similarity with 8471.30.90 or 8517.62.59 categories.');
    }

    // 4. Description Semantic Cross-Check
    if (goodsDescription && rule) {
      const descLower = goodsDescription.toLowerCase();
      const ruleDescLower = rule.description.toLowerCase();

      let wordMatchCount = 0;
      const descWords = descLower.split(/\s+/).filter(w => w.length > 3);
      descWords.forEach(w => {
        if (ruleDescLower.includes(w)) wordMatchCount++;
      });

      if (descWords.length > 0 && wordMatchCount === 0) {
        result.issues.push({
          severity: 'warning',
          code: 'WARN_DESC_MISMATCH',
          message: 'Goods description on invoice does not align semantically with official HS Code heading.'
        });
        if (result.riskLevel === 'low') result.riskLevel = 'medium';
        result.recommendations.push('Review invoice line items for potential re-classification.');
      }
    }

    return result;
  }

  formatDotted(codeStr) {
    const c = (codeStr || '').replace(/[^0-9]/g, '');
    if (c.length === 8) {
      return `${c.substring(0,4)}.${c.substring(4,6)}.${c.substring(6,8)}`;
    } else if (c.length === 10) {
      return `${c.substring(0,4)}.${c.substring(4,6)}.${c.substring(6,8)}.${c.substring(8,10)}`;
    }
    return codeStr;
  }
}

window.HSCodeValidator = HSCodeValidator;
