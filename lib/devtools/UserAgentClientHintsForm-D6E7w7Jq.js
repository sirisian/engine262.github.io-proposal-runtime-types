import{a$ as e,ah as t,aQ as a,aO as n,b0 as r,aR as i,aP as l,b1 as s,at as o,L as d}from"./index.js";import{a5 as c,Y as u,$ as h}from"./ContentData-B0wAfF2C.js";var p,m=((p={})[p.ERROR=0]="ERROR",p[p.PARAM_NAME=1]="PARAM_NAME",p[p.PARAMETER=2]="PARAMETER",p[p.PARAMETERS=3]="PARAMETERS",p[p.ITEM=4]="ITEM",p[p.INTEGER=5]="INTEGER",p[p.DECIMAL=6]="DECIMAL",p[p.STRING=7]="STRING",p[p.TOKEN=8]="TOKEN",p[p.BINARY=9]="BINARY",p[p.BOOLEAN=10]="BOOLEAN",p[p.LIST=11]="LIST",p[p.INNER_LIST=12]="INNER_LIST",p[p.SERIALIZATION_RESULT=13]="SERIALIZATION_RESULT",p);function f(e){return void 0!==e&&e>=48&&e<=57}function b(e){return void 0!==e&&(e>=65&&e<=90||e>=97&&e<=122)}function v(e){return void 0!==e&&e>=97&&e<=122}function g(){return{kind:0}}function $(e){var t;return 5===e.kind?(t=e).value<-0x38d7ea4c67fff||t.value>0x38d7ea4c67fff||!Number.isInteger(t.value)?g():{kind:13,value:t.value.toString(10)}:6===e.kind?function(){throw Error("Unimplemented")}():7===e.kind?function(e){for(let t=0;t<e.value.length;++t){let a=e.value.charCodeAt(t);if(a<32||a>126)return g()}let t='"';for(let a=0;a<e.value.length;++a){let n=e.value[a];('"'===n||"\\"===n)&&(t+="\\"),t+=n}return{kind:13,value:t+='"'}}(e):8===e.kind?function(e){if(0===e.value.length)return g();let t=e.value.charCodeAt(0);if(!b(t)&&42!==t)return g();for(let t=1;t<e.value.length;++t){let a=e.value.charCodeAt(t);if(!function(e){if(void 0===e)return!1;if(f(e)||b(e))return!0;switch(e){case 33:case 35:case 36:case 37:case 38:case 39:case 42:case 43:case 45:case 46:case 94:case 95:case 96:case 124:case 126:return!0;default:return!1}}(a)&&58!==a&&47!==a)return g()}return{kind:13,value:e.value}}(e):10===e.kind?{kind:13,value:e.value?"?1":"?0"}:9===e.kind?function(){throw Error("Unimplemented")}():g()}function A(e,t){return function(e){let t=$(e.value);if(0===t.kind)return t;let a=function(e){let t="";for(let a of e.items){t+=";";let e=function(e){if(0===e.value.length)return g();let t=e.value.charCodeAt(0);if(!v(t)&&42!==t)return g();for(let t=1;t<e.value.length;++t){let a=e.value.charCodeAt(t);if(!v(a)&&!f(a)&&95!==a&&45!==a&&46!==a&&42!==a)return g()}return{kind:13,value:e.value}}(a.name);if(0===e.kind)return e;t+=e.value;let n=a.value;if(10!==n.kind||!n.value){t+="=";let e=$(n);if(0===e.kind)return e;t+=e.value}}return{kind:13,value:t}}(e.parameters);return 0===a.kind?a:{kind:13,value:t.value+a.value}}({kind:m.ITEM,value:{kind:m.STRING,value:e},parameters:{kind:m.PARAMETERS,items:[]}}).kind===m.ERROR?{valid:!1,errorMessage:t}:{valid:!0}}let{html:k}=d,w={title:"User agent client hints",useragent:"User agent (Sec-CH-UA)",fullVersionList:"Full version list (Sec-CH-UA-Full-Version-List)",brandProperties:"User agent properties",brandName:"Brand",brandNameAriaLabel:"Brand {PH1}",significantBrandVersionPlaceholder:"Significant version (e.g. 87)",brandVersionPlaceholder:"Version (e.g. 87.0.4280.88)",brandVersionAriaLabel:"Version {PH1}",addBrand:"Add Brand",brandUserAgentDelete:"Delete brand from user agent section",brandFullVersionListDelete:"Delete brand from full version list",formFactorsTitle:"Form Factors (Sec-CH-UA-Form-Factors)",formFactorsGroupAriaLabel:"Available Form Factors",formFactorDesktop:"Desktop",formFactorAutomotive:"Automotive",formFactorMobile:"Mobile",formFactorTablet:"Tablet",formFactorXR:"XR",formFactorEInk:"EInk",formFactorWatch:"Watch",fullBrowserVersion:"Full browser version (Sec-CH-UA-Full-Version)",fullBrowserVersionPlaceholder:"Full browser version (e.g. 87.0.4280.88)",platformLabel:"Platform (Sec-CH-UA-Platform / Sec-CH-UA-Platform-Version)",platformProperties:"Platform properties",platformVersion:"Platform version",platformPlaceholder:"Platform (e.g. Android)",architecture:"Architecture (Sec-CH-UA-Arch)",architecturePlaceholder:"Architecture (e.g. x86)",deviceProperties:"Device properties",deviceModel:"Device model (Sec-CH-UA-Model)",mobileCheckboxLabel:"Mobile",update:"Update",notRepresentable:"Not representable as structured headers string.",userAgentClientHintsInfo:"User agent client hints are an alternative to the user agent string that identify the browser and the device in a more structured way with better privacy accounting.",addedBrand:"Added brand row",deletedBrand:"Deleted brand row",learnMore:"Learn more"},x=h("panels/settings/emulation/components/UserAgentClientHintsForm.ts",w),F=u.bind(void 0,x);class D extends Event{static eventName="clienthintschange";constructor(){super(D.eventName)}}class y extends Event{static eventName="clienthintssubmit";detail;constructor(e){super(y.eventName),this.detail={value:e}}}let E={brands:[{brand:"",version:""}],fullVersionList:[{brand:"",version:""}],fullVersion:"",platform:"",platformVersion:"",architecture:"",model:"",mobile:!1,formFactors:[]},L=[w.formFactorDesktop,w.formFactorAutomotive,w.formFactorMobile,w.formFactorTablet,w.formFactorXR,w.formFactorEInk,w.formFactorWatch];class C extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=!1;#a=!1;#n=E;#r=!1;#i=!1;#l="";set value(e){let{metaData:t=E,showMobileCheckbox:a=!1,showSubmitButton:n=!1}=e;this.#n={...this.#n,...t},this.#r=a,this.#i=n,this.#s()}get value(){return{metaData:this.#n}}set disabled(e){this.#a=e,this.#t=!1,this.#s()}get disabled(){return this.#a}#o=e=>{("Space"===e.code||"Enter"===e.code||"ArrowLeft"===e.code||"ArrowRight"===e.code)&&(e.consume(!0),this.#d(e.code))};#d=e=>{this.#a||("ArrowLeft"!==e||this.#t)&&("ArrowRight"!==e||!this.#t)&&(this.#t=!this.#t,this.#s())};#c=(e,t,a)=>{let n=this.#n.brands?.map((n,r)=>{if(r===t){let{brand:t,version:r}=n;return"brandName"===a?{brand:e,version:r}:{brand:t,version:e}}return n});this.#n={...this.#n,brands:n},this.dispatchEvent(new D),this.#s()};#u=(e,t,a)=>{let n=this.#n.fullVersionList?.map((n,r)=>{if(r===t){let{brand:t,version:r}=n;return"brandName"===a?{brand:e,version:r}:{brand:t,version:e}}return n});this.#n={...this.#n,fullVersionList:n},this.dispatchEvent(new D),this.#s()};#h=e=>{let{brands:t=[]}=this.#n;t.splice(e,1),this.#n={...this.#n,brands:t},this.dispatchEvent(new D),this.#l=F(w.deletedBrand),this.#s();let a=this.shadowRoot?.getElementById(`ua-brand-${e+1}-input`);a||(a=this.shadowRoot?.getElementById("add-brand-button")),a?.focus()};#p=e=>{let{fullVersionList:t=[]}=this.#n;t.splice(e,1),this.#n={...this.#n,fullVersionList:t},this.dispatchEvent(new D),this.#l=F(w.deletedBrand),this.#s();let a=this.shadowRoot?.getElementById(`fvl-brand-${e+1}-input`);a||(a=this.shadowRoot?.getElementById("add-fvl-brand-button")),a?.focus()};#m=()=>{let{brands:e}=this.#n;this.#n={...this.#n,brands:[...Array.isArray(e)?e:[],{brand:"",version:""}]},this.dispatchEvent(new D),this.#l=F(w.addedBrand),this.#s();let t=this.shadowRoot?.querySelectorAll(".ua-brand-name-input");if(t){let e=Array.from(t).pop();e&&e.focus()}};#f=e=>{("Space"===e.code||"Enter"===e.code)&&(e.preventDefault(),this.#m())};#b=()=>{let{fullVersionList:e}=this.#n;this.#n={...this.#n,fullVersionList:[...Array.isArray(e)?e:[],{brand:"",version:""}]},this.dispatchEvent(new D),this.#l=F(w.addedBrand),this.#s();let t=this.shadowRoot?.querySelectorAll(".fvl-brand-name-input");if(t){let e=Array.from(t).pop();e&&e.focus()}};#v=e=>{("Space"===e.code||"Enter"===e.code)&&(e.preventDefault(),this.#b())};#g=(e,t)=>{let a=[...this.#n.formFactors||[]];t?a.includes(e)||a.push(e):a=a.filter(t=>t!==e),this.#n={...this.#n,formFactors:a},this.dispatchEvent(new D),this.#s()};#$=(e,t)=>{e in this.#n&&(this.#n={...this.#n,[e]:t},this.#s()),this.dispatchEvent(new D)};#A=e=>{e.preventDefault(),this.#i&&(this.dispatchEvent(new y(this.#n)),this.#s())};#k(t,a,n,r){let i=e=>{let t=e.target.value;this.#$(r,t)};return k`
      <label class="full-row label input-field-label-container">
        ${t}
        <input
          class="input-field"
          type="text"
          @input=${i}
          .value=${n}
          placeholder=${a}
          jslog=${e().track({change:!0}).context(c(r))}
          />
      </label>
    `}#w(){let{platform:t,platformVersion:a}=this.#n,n=e=>{let t=e.target.value;this.#$("platform",t)},r=e=>{let t=e.target.value;this.#$("platformVersion",t)};return k`
      <span class="full-row label">${F(w.platformLabel)}</span>
      <div class="full-row brand-row" aria-label=${F(w.platformProperties)} role="group">
        <input
          class="input-field half-row"
          type="text"
          @input=${n}
          .value=${t}
          placeholder=${F(w.platformPlaceholder)}
          aria-label=${F(w.platformLabel)}
          jslog=${e("platform").track({change:!0})}
        />
        <input
          class="input-field half-row"
          type="text"
          @input=${r}
          .value=${a}
          placeholder=${F(w.platformVersion)}
          aria-label=${F(w.platformVersion)}
          jslog=${e("platform-version").track({change:!0})}
        />
      </div>
    `}#x(){let{model:n,mobile:r}=this.#n,i=e=>{let t=e.target.value;this.#$("model",t)},l=e=>{let t=e.target.checked;this.#$("mobile",t)},s=this.#r?k`
      <label class="mobile-checkbox-container">
        <input type="checkbox" @input=${l} .checked=${r}
          jslog=${t("mobile").track({click:!0})}
        />
        ${F(w.mobileCheckboxLabel)}
      </label>
    `:a;return k`
      <span class="full-row label">${F(w.deviceModel)}</span>
      <div class="full-row brand-row" aria-label=${F(w.deviceProperties)} role="group">
        <input
          class="input-field ${this.#r?"device-model-input":"full-row"}"
          type="text"
          @input=${i}
          .value=${n}
          placeholder=${F(w.deviceModel)}
          jslog=${e("model").track({change:!0})}
        />
        ${s}
      </div>
    `}#F(){let{brands:t=[{brand:"",version:""}]}=this.#n,a=t.map((t,a)=>{let{brand:n,version:r}=t,i=()=>{this.#h(a)},l=e=>{let t=e.target.value;this.#c(t,a,"brandName")},s=e=>{let t=e.target.value;this.#c(t,a,"brandVersion")};return k`
        <div class="full-row brand-row" aria-label=${F(w.brandProperties)} role="group">
          <input
            class="input-field ua-brand-name-input"
            type="text"
            @input=${l}
            .value=${n}
            id="ua-brand-${a+1}-input"
            placeholder=${F(w.brandName)}
            aria-label=${F(w.brandNameAriaLabel,{PH1:a+1})}
            jslog=${e("brand-name").track({change:!0})}
          />
          <input
            class="input-field"
            type="text"
            @input=${s}
            .value=${r}
            placeholder=${F(w.significantBrandVersionPlaceholder)}
            aria-label=${F(w.brandVersionAriaLabel,{PH1:a+1})}
            jslog=${e("brand-version").track({change:!0})}
          />
          <devtools-icon name="bin"
            title=${F(w.brandUserAgentDelete)}
            class="medium delete-icon"
            tabindex="0"
            role="button"
            @click=${i}
            @keypress=${e=>{("Space"===e.code||"Enter"===e.code)&&(e.preventDefault(),i())}}
            aria-label=${F(w.brandUserAgentDelete)}
          >
          </devtools-icon>
        </div>
      `});return k`
      <span class="full-row label">${F(w.useragent)}</span>
      ${a}
      <div
        class="add-container full-row"
        role="button"
        tabindex="0"
        id="add-brand-button"
        aria-label=${F(w.addBrand)}
        @click=${this.#m}
        @keypress=${this.#f}
      >
        <devtools-icon
          aria-hidden="true" name="plus" class="medium">
        </devtools-icon>
        ${F(w.addBrand)}
      </div>
    `}#D(){let{fullVersionList:t=[{brand:"",version:""}]}=this.#n,a=t.map((t,a)=>{let{brand:r,version:i}=t,l=()=>{this.#p(a)},s=e=>{let t=e.target.value;this.#u(t,a,"brandName")},o=e=>{let t=e.target.value;this.#u(t,a,"brandVersion")};return k`
        <div
          class="full-row brand-row"
          aria-label=${F(w.brandProperties)}
          jslog=${n("full-version")}
          role="group">
          <input
            class="input-field fvl-brand-name-input"
            type="text"
            @input=${s}
            .value=${r}
            id="fvl-brand-${a+1}-input"
            placeholder=${F(w.brandName)}
            aria-label=${F(w.brandNameAriaLabel,{PH1:a+1})}
            jslog=${e("brand-name").track({change:!0})}
          />
          <input
            class="input-field"
            type="text"
            @input=${o}
            .value=${i}
            placeholder=${F(w.brandVersionPlaceholder)}
            aria-label=${F(w.brandVersionAriaLabel,{PH1:a+1})}
            jslog=${e("brand-version").track({change:!0})}
          />
          <devtools-icon name="bin" 
            title=${F(w.brandFullVersionListDelete)}
            class="medium delete-icon"
            tabindex="0"
            role="button"
            @click=${l}
            @keypress=${e=>{("Space"===e.code||"Enter"===e.code)&&(e.preventDefault(),l())}}
            aria-label=${F(w.brandFullVersionListDelete)}
          >
          </devtools-icon>
        </div>
      `});return k`
      <span class="full-row label">${F(w.fullVersionList)}</span>
      ${a}
      <div
        class="add-container full-row"
        role="button"
        tabindex="0"
        id="add-fvl-brand-button"
        aria-label=${F(w.addBrand)}
        @click=${this.#b}
        @keypress=${this.#v}
      >
        <devtools-icon name="plus" class="medium"
          aria-hidden="true">
        </devtools-icon>
        ${F(w.addBrand)}
      </div>
    `}#y(){let e=L.map(e=>{let a=this.#n.formFactors?.includes(e)||!1,n=F(w[`formFactor${e}`]);return k`
        <label class="form-factor-checkbox-label">
          <input
            type="checkbox"
            .checked=${a}
            value=${e}
            jslog=${t(c(e)).track({click:!0})}
            @change=${t=>this.#g(e,t.target.checked)}
          />
          ${n}
        </label>
      `});return k`
      <span class="full-row label" jslog=${r("form-factors")}>
        ${F(w.formFactorsTitle)}
      </span>
      <div class="full-row form-factors-checkbox-group" role="group" aria-label=${F(w.formFactorsGroupAriaLabel)}>
        ${e}
      </div>
    `}#s(){let{fullVersion:e,architecture:t}=this.#n,n=this.#F(),r=this.#D(),d=this.#k(F(w.fullBrowserVersion),F(w.fullBrowserVersionPlaceholder),e||"","fullVersion"),c=this.#y(),u=this.#w(),h=this.#k(F(w.architecture),F(w.architecturePlaceholder),t,"architecture"),p=this.#x(),m=this.#i?k`
      <devtools-button
        .variant=${i.OUTLINED}
        .type=${"submit"}
      >
        ${F(w.update)}
      </devtools-button>
    `:a;o(k`
      <style>${l}</style>
      <style>${'/** front_end/panels/settings/emulation/components/userAgentClientHintsForm.css */\n/*\n * Copyright 2021 The Chromium Authors\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.root {\n  color: var(--sys-color-on-surface);\n  width: 100%;\n}\n\n.tree-title {\n  font-weight: 700;\n  display: flex;\n  align-items: center;\n\n  & > [aria-controls="form-container"] {\n    margin-left: var(--sys-size-2);\n    padding-right: var(--sys-size-3);\n\n    & > [name="triangle-right"],\n    & > [name="triangle-down"] {\n      vertical-align: bottom;\n    }\n\n    &[aria-expanded="true"] > [name="triangle-right"] {\n      display: none;\n    }\n\n    &[aria-expanded="false"] > [name="triangle-down"] {\n      display: none;\n    }\n  }\n}\n\n.form-container {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr auto;\n  align-items: center;\n  gap: 8px 10px;\n  padding: 0 10px;\n}\n\n.full-row {\n  grid-column: 1 / 5;\n}\n\n.form-factors-checkbox-group {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 6px 10px;\n}\n\n.form-factor-checkbox-label {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  white-space: nowrap;\n}\n\nhr.section-separator {\n  grid-column: 1 / 5; /* Ensures the separator spans all columns */\n  border: none;\n  margin-top: 1px;\n}\n\n.half-row {\n  grid-column: span 2;\n}\n\n.mobile-checkbox-container {\n  display: flex;\n}\n\n.device-model-input {\n  grid-column: 1 / 4;\n}\n\n.input-field {\n  color: var(--sys-color-on-surface);\n  padding: 3px 6px;\n  border-radius: 2px;\n  border: 1px solid var(--sys-color-neutral-outline);\n  background-color: var(--sys-color-cdt-base-container);\n  font-size: inherit;\n  height: 18px;\n}\n\n.input-field::placeholder {\n    color: var(--sys-color-on-surface-subtle);\n}\n\n.input-field:focus {\n  border: 1px solid var(--sys-color-state-focus-ring);\n  outline-style: none;\n}\n\n.add-container {\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.add-icon {\n  margin-right: 5px;\n}\n\n.brand-row {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  justify-content: space-between;\n}\n\n.brand-row > input {\n  width: 100%;\n}\n\n.info-icon {\n  margin-left: 5px;\n  margin-right: 1px;\n  height: var(--sys-size-8);\n  width: var(--sys-size-8);\n}\n\n.link,\n.devtools-link {\n  color: var(--sys-color-primary);\n  text-decoration: underline;\n  cursor: pointer;\n  outline-offset: 2px;\n  font-weight: 400;\n}\n\ndevtools-icon + .link {\n  margin-inline-start: 2px;\n}\n\n.hide-container {\n  display: none;\n}\n\n.input-field-label-container {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n@media (forced-colors: active) {\n  .input-field {\n    border: 1px solid;\n  }\n\n  .tree-title[aria-disabled="true"] {\n    color: GrayText;\n  }\n}\n'}</style>
      <section class="root">
        <div class="tree-title">
          <div
            role=button
            @click=${this.#d}
            tabindex=${this.#a?"-1":"0"}
            @keydown=${this.#o}
            aria-expanded=${this.#t}
            aria-controls=form-container
            aria-disabled=${this.#a}
            aria-label=${F(w.title)}
            jslog=${s().track({click:!0})}>
            <devtools-icon name=triangle-right></devtools-icon>
            <devtools-icon name=triangle-down></devtools-icon>
            ${F(w.title)}
          </div>
          <devtools-icon tabindex=${this.#a?"-1":"0"} class=info-icon name=info aria-label=${F(w.userAgentClientHintsInfo)} title=${F(w.userAgentClientHintsInfo)}></devtools-icon>
          <devtools-link
           tabindex=${this.#a?"-1":"0"}
           href="https://web.dev/user-agent-client-hints/"
           class="link"
           aria-label=${F(w.learnMore)}
           jslogcontext="learn-more"
          >
            ${F(w.learnMore)}
          </devtools-link>
        </div>
        <form
          id="form-container"
          class="form-container ${this.#t?"":"hide-container"}"
          @submit=${this.#A}
        >
          ${n}
          <hr class="section-separator">
          ${r}
          <hr class="section-separator">
          ${d}
          <hr class="section-separator">
          ${c}
          <hr class="section-separator">
          ${u}
          <hr class="section-separator">
          ${h}
          <hr class="section-separator">
          ${p}
          ${m}
        </form>
        <div aria-live="polite" aria-label=${this.#l}></div>
      </section>
    `,this.#e,{host:this})}validate=()=>{for(let[e,t]of Object.entries(this.#n))if("brands"===e||"fullVersionList"===e){if(!this.#n.brands?.every(({brand:e,version:t})=>{let a=A(e,F(w.notRepresentable)),n=A(t,F(w.notRepresentable));return a.valid&&n.valid}))return{valid:!1,errorMessage:F(w.notRepresentable)}}else if("formFactors"===e){if(t)for(let e of t){if(!L.includes(e))return{valid:!1,errorMessage:F(w.notRepresentable)+` (Invalid form factor: ${e})`};let t=A(e,F(w.notRepresentable));if(!t.valid)return t}}else{let e=A(t,F(w.notRepresentable));if(!e.valid)return e}return{valid:!0}}}customElements.define("devtools-user-agent-client-hints-form",C);export{C as U};
