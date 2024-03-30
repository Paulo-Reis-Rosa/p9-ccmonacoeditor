/**
 * Use this namespace to reference objects in your custom component.
 * 
 * When using custom components you might have multiple instances of the
 * same custom component. When you add a custom component to an app this
 * namespace is renamed to the custom component object name in the app.
 * 
 * E.g. if the custom component object name is myCustomComponent you can call
 * functions from this namespace with myCustomComponent.foo()
 *
 */
// var require={paths:{'vs':'/media/root/libraries/legacy/monaco/min/vs'}};
namespace CustomComponent {
    console.log("Executing the namespace from ccmonacoeditor");
    const C_MATCH_VIEW_ID_PART = /^(__jsview\d*)--/;
    const C_MATCH_COMPONENT_ID_PART = /--(.*)$/;
    const C_MATCH_SHORT_COMPONENT_ID_PART = /^(.*)_Wrapper$/;

    let lvViewId = (C_MATCH_VIEW_ID_PART.test(Wrapper.getId())) 
                    ? /* VIEW in a Launchpad */ C_MATCH_VIEW_ID_PART.exec(Wrapper.getId())[1]
                    : /* Maybe standalone */ '';
    let lvFullComponentId = (C_MATCH_COMPONENT_ID_PART.test(Wrapper.getId()))
                    ? /* VIEW in a Launchpad */ C_MATCH_COMPONENT_ID_PART.exec(Wrapper.getId())[1]
                    : /* Maybe standalone */ Wrapper.getId();
    if (!C_MATCH_SHORT_COMPONENT_ID_PART.test(lvFullComponentId)) {
        /* Nop, definitely wrong. The name must be in the format `_jsview${number}--${shortId}_Wrapper` or `${shortId}_Wrapper` */
        /* Throws an exception */
        throw `'${lvFullComponentId}' is an invalid wrapper component for the MonacoEditor custom component`;
    }
    let lvShortId = C_MATCH_SHORT_COMPONENT_ID_PART.exec(lvFullComponentId)[1];

    let loData = {
        sId: lvShortId,
        sViewId: lvViewId,
        bAutoInit: Content.getVisible(),
        oView: (lvViewId)
            ? sap.ui.getCore().byId(lvViewId)
            : { createId: pvIdName => String(pvIdName) },
        oUi5HtmlRoot: Content,
        oMonacoOptions: {},
        oHtmlRoot: null,
        oEditor: null,
        onLoad: null,
        _oOnLoadOk: null,
        _oOnLoadError: null,
        onEditorCreated: null,
        _oOnEditorCreatedOk: null,
        _oOnEditorCreatedError: null
    };
    
    if (Array.isArray(OptionsBuilder['mEventRegistry'].press) && OptionsBuilder['mEventRegistry'].press.length) {
        setMonacoOptions(OptionsBuilder['mEventRegistry'].press[0].fFunction());
    } 
    loData.onLoad = new Promise((ok, error)=>{loData._oOnLoadOk = ok; loData._oOnLoadError = error;});
    loData.onEditorCreated = new Promise((ok, error)=>{loData._oOnEditorCreatedOk = ok; loData._oOnEditorCreatedError = error;});
    Content.setTooltip('');
    Content.setVisible(true);
    Content.attachAfterRendering(poEvent => {
        loData._oOnLoadOk(poEvent);
        if (loData.bAutoInit) {
            initEditor();
        }
    });
    Content.setContent(`<div id='${Content.getId()}' style='width:100%; height:100%'></div>`);

    function _initializeMonacoObjectAndEditor( pvPass, poResolveInit, poRejectInit ) {
        if (isNaN(Number.parseInt(pvPass)) || Number.parseInt(pvPass) < 1 || Number.parseInt(pvPass) > 2) {
            throw new Error(`monaco@${Content.getId()}' failed to initialize: max tries reached`);
        }
        //@ts-ignore
        let loThisConfig = ccmonacoeditorConfig;
        //@ts-ignore
        if (typeof window.ccmonacoeditorRequire === "undefined") {window.ccmonacoeditorRequire = window.require}
        //@ts-ignore
        new Promise(resolve => ccmonacoeditorRequire(['vs/editor/editor.main'], resolve))
            .then( monaco => {
                console.log(`'monaco@${Content.getId()}' is creating the editor.`);
                try {
                    //@ts-ignore
                    loData.oEditor = monaco.editor.create(Content.getDomRef(), loData.oMonacoOptions);
                    poResolveInit(loData.oEditor);
                    loData._oOnEditorCreatedOk(loData.oEditor);
                }
                catch (e) {
                    poRejectInit(e);
                    loData._oOnEditorCreatedError(e);
                }
            })
            .catch( (e) => {
                if (pvPass === 1) {
                    // there may be a chance that the library did not load. Try to load it dynamically.
                    //@ts-ignore
                    let loWindowRequire = window.require;
                    //@ts-ignore
                    window.require = loThisConfig.loaderConfig;
                    let loScriptElement = document.createElement('script');
                    loScriptElement.setAttribute("src", loThisConfig.loader);
                    loScriptElement.setAttribute("type", "text/javascript");
                    loScriptElement.setAttribute("async", "false");
                    // success event 
                    loScriptElement.addEventListener("load", () => {
                        //@ts-ignore
                        window.ccmonacoeditorRequire = window.require;
                        _initializeMonacoObjectAndEditor(2, poResolveInit, poRejectInit);
                        //@ts-ignore
                        window.require = loWindowRequire;
                    });
                    // error event
                    loScriptElement.addEventListener("error", (ev) => {
                        let lvErrorMessage = `monaco@${Content.getId()}' failed to initialize (dyn load): ${String(e)}`;
                        console.warn(lvErrorMessage);
                        poRejectInit(lvErrorMessage);
                        loData._oOnEditorCreatedError(lvErrorMessage);
                    });
                    // Append script
                    document.body.appendChild(loScriptElement);
                    return;
                }
                let lvErrorMessage = `monaco@${Content.getId()}' failed to initialize (pass ${pvPass}): ${String(e)}`;
                console.warn(lvErrorMessage);
                poRejectInit(lvErrorMessage);
                loData._oOnEditorCreatedError(lvErrorMessage);
            });

    }
    export function onLoad( ) { return loData.onLoad;}
    export function onEditorCreated( ) { return loData.onEditorCreated;}

    export function initEditor() {
        if (loData.oEditor) {
            console.warn(`The editor for ${loData.sId} already exists. Leaving`);
            loData._oOnEditorCreatedOk(loData.oEditor);
            return new Promise(resolveInit => resolveInit(loData.oEditor));
        }
        console.log(`Preparing ${loData.sId}, before creating the editor`);
        return new Promise((resolveInit, rejectInit) => {
            loData.onLoad.then(() => {
                console.log(`${loData.sId}: root rendering is done => creating the editor`);
                _initializeMonacoObjectAndEditor(1, resolveInit, rejectInit);
            });
        });
    }
    export function getMonacoEditor() {
        return loData.oEditor;
    }

    export function getValue() {
        if (loData.oEditor) { return loData.oEditor.getValue(); }
        //@ts-ignore
        else                { return (typeof loData?.oMonacoOptions?.value==='string') ? loData.oMonacoOptions.value : ''; }
    }
    export function setValue( pvValue ) {
        if (loData.oEditor) { loData.oEditor.setValue(pvValue) }
        else {
            let lvValue = ((typeof pvValue === 'undefined') || (pvValue === null)) ? '' : String(pvValue);
            if (typeof loData.oMonacoOptions === 'object') {
                //@ts-ignore
                loData.oMonacoOptions.value = lvValue;
            }
            else {
                loData.oMonacoOptions = {value: lvValue};
            }
        }
    }
    
    export function getLineCount () {
        let lvText = getValue();
        if ((typeof lvText === 'undefined') || (lvText === null)) { return 0; }
        else {
            let loMatches = String(lvText).match(/\r\n|\n\r|\n|\r/g);
            return loMatches ? loMatches.length + 1: 1;
        }
    }
    export const autoInit = loData.bAutoInit;

    export function getVisible() { return Wrapper.getVisible(); }
    export function getWidth() { return Wrapper.getWidth(); }
    export function getHeight() { return Wrapper.getHeight(); }
    export function getBusy() { return Wrapper.getBusy(); }
    export function getBusyIndicatorDelay() { return Wrapper.getBusyIndicatorDelay(); }
    export function getBusyIndicatorSize() { return Wrapper.getBusyIndicatorSize(); }
    export function getPreferDOM() { return Content.getPreferDOM(); }

    export function setVisible( pvState ) { return Wrapper.setVisible( pvState ); }
    export function setWidth( pvSize ) { return Wrapper.setWidth( pvSize ); }
    export function setHeight( pvSize ) { return Wrapper.setHeight( pvSize ); }
    export function setBusy( pvState ) { return Wrapper.setBusy( pvState ); }
    export function setBusyIndicatorDelay( pvNumber ) { return Wrapper.setBusyIndicatorDelay( pvNumber ); }
    export function setBusyIndicatorSize( pvSize ) { return Wrapper.setBusyIndicatorSize( pvSize ); }
    export function setPreferDOM( pvState ) { return Content.setPreferDOM( pvState ); }

    export function getMonacoOptions() {return loData.oMonacoOptions;}
    export function setMonacoOptions(poMonacoOptions) {
        try {
            if (typeof poMonacoOptions === 'undefined') {
                loData.oMonacoOptions = {}; 
                return;
            }
            // uses JSON.parse/stringify only to test if the format is JSON compatible
            JSON.parse(JSON.stringify(poMonacoOptions));
            if (Array.isArray(poMonacoOptions)) {
                throw 'The root must be an object, not an array';
            }
            loData.oMonacoOptions = $.extend(true, {}, poMonacoOptions);
            return;
        }
        catch (e) {
            throw `Invalid monaco options: ${String(e)}`;
        }
    }
}