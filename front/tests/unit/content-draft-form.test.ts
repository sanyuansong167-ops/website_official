import { describe, expect, it } from "vitest";
import {
  contentDraftToForm,
  mergeContentDraftForm,
  type ContentDraftForm,
} from "@/features/content-editor/content-draft-form";

describe("content draft form adapter", () => {
  it("maps a product draft to canonical product, media, relation and nested SEO fields", () => {
    const draft = {
      extra: { id: 7 },
      logoMediaId: 11,
      name: "旧产品",
      relatedCaseIds: [21],
      seoDescription: "旧描述",
      seoKeywords: "旧词",
      seoTitle: "旧 SEO",
      summary: "旧摘要",
    };
    const form = contentDraftToForm(draft, "product");

    expect(form).toMatchObject({
      primaryMediaId: 11,
      relatedCaseIds: [21],
      seoDescription: "旧描述",
      seoKeywords: "旧词",
      seoTitle: "旧 SEO",
      summary: "旧摘要",
      title: "旧产品",
    });

    const merged = mergeContentDraftForm(draft, {
      ...emptyForm(),
      applicationScenarios: "制造\n零售",
      coverMediaId: 12,
      features: "功能 A\n功能 B",
      highlights: "亮点 A",
      primaryMediaId: 13,
      relatedCaseIds: [22, 23],
      relatedIndustrySolutionIds: [31],
      seoDescription: " SEO 描述 ",
      seoKeywords: "数据，智能",
      seoTitle: " 产品 SEO ",
      shortTitle: " 短标题 ",
      summary: " 新摘要 ",
      title: " 新产品 ",
    }, "product");

    expect(merged).toMatchObject({
      applicableIndustries: ["制造", "零售"],
      coverMediaId: 12,
      extra: { id: 7 },
      features: ["功能 A", "功能 B"],
      highlights: ["亮点 A"],
      logoId: 13,
      name: "新产品",
      relatedCaseIds: [22, 23],
      relatedIndustrySolutionIds: [31],
      seo: { description: "SEO 描述", keywords: ["数据", "智能"], title: "产品 SEO" },
      shortTitle: "短标题",
    });
    expect(merged).not.toHaveProperty("seoTitle");
    expect(merged).not.toHaveProperty("logoMediaId");
  });

  it("preserves the case structure and uses supported case relation fields", () => {
    const form = contentDraftToForm({
      background: "背景",
      content: "<p>正文</p>",
      coverMediaId: 41,
      customerName: "客户",
      industry: "制造",
      logoMediaId: 40,
      productIds: [3, 4],
      recommendedCaseIds: [5],
      result: "成果",
      seo: { description: "描述", keywords: ["案例", "制造"], title: "SEO" },
      solution: "方案",
      summary: "摘要",
      title: "案例标题",
    }, "case");

    expect(form).toMatchObject({
      background: "背景",
      content: "<p>正文</p>",
      coverMediaId: 41,
      customerName: "客户",
      industry: "制造",
      primaryMediaId: 40,
      relatedCaseIds: [5],
      relatedProductIds: [3, 4],
      result: "成果",
      seoKeywords: "案例，制造",
      solution: "方案",
      title: "案例标题",
    });

    expect(mergeContentDraftForm({}, form, "case")).toMatchObject({
      background: "背景",
      content: "<p>正文</p>",
      logoMediaId: 40,
      recommendedCaseIds: [5],
      relatedProductIds: [3, 4],
      result: "成果",
      solution: "方案",
      summary: "摘要",
      title: "案例标题",
    });
  });

  it("maps solution icon, tags, structured content and relations", () => {
    const merged = mergeContentDraftForm({ legacyValue: true }, {
      ...emptyForm(),
      applicationScenarios: "场景 A",
      coreCapabilities: "能力 A\n能力 B",
      customerTags: "建材\n制造",
      painPoints: "痛点 A",
      primaryMediaId: 51,
      relatedCaseIds: [61],
      relatedIndustrySolutionIds: [62],
      relatedProductIds: [63],
      solutionApproach: "思路 A",
      summary: "方案摘要",
      title: "行业方案",
    }, "solution");

    expect(merged).toMatchObject({
      applicationScenarios: ["场景 A"],
      coreCapabilities: ["能力 A", "能力 B"],
      customerTags: ["建材", "制造"],
      description: "方案摘要",
      iconMediaId: 51,
      legacyValue: true,
      name: "行业方案",
      painPoints: ["痛点 A"],
      relatedCaseIds: [61],
      relatedIndustrySolutionIds: [62],
      relatedProductIds: [63],
      solutionApproach: ["思路 A"],
    });
  });
});

function emptyForm(): ContentDraftForm {
  return {
    applicationScenarios: "",
    background: "",
    content: "",
    coreCapabilities: "",
    coverAltText: "",
    coverMediaId: null,
    customerName: "",
    customerTags: "",
    features: "",
    galleryMediaIds: [],
    heroAltText: "",
    heroMediaId: null,
    highlights: "",
    industry: "",
    painPoints: "",
    primaryMediaAltText: "",
    primaryMediaId: null,
    relatedCaseIds: [],
    relatedIndustrySolutionIds: [],
    relatedProductIds: [],
    result: "",
    seoDescription: "",
    seoKeywords: "",
    seoTitle: "",
    shortTitle: "",
    solution: "",
    solutionApproach: "",
    summary: "",
    title: "",
  };
}
