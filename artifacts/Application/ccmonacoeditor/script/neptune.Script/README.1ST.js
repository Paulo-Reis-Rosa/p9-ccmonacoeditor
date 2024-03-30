/*
Code revision: 20240330

==> IMPORTANT
    This implementation of the monaco editor custom component uses window.ccmonacoeditorConfig and window.ccmonacoeditorRequire as 
    reserved keywords. It should not conflict with any other application in the web, but if for some reason the names clash is possible 
    that either the editor or the other library will stop working correctly

==> INSTALLATION 
    To use the monaco editor custom component, instead of the site mentioned header scripts:
        <script>var require={paths:{'vs':'/<path-to>/monaco/min/vs'}};</script>
        <script src="/<path-to>/monaco/min/vs/loader.js"></script>

    Use
        <script>
            var ccmonacoeditorConfig={
                loaderConfig: {paths:{'vs':'/<path-to>/monaco/min/vs'}},
                loader: "/<path-to>/monaco/min/vs/loader.js"
            };
        </script>

    This change is important to remove conflicts with other libraries that are also loaded dynamically and use a similar process.

==> USAGE
    Use this template if you want to use monacoOptionsBuilder for a javascript code editor:
        return {
            value: '// this is a Javascript code editor\n', 
            language: 'javascript',
            lineNumbers: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: true,
            readOnly: false,
            theme: 'vs-light'
        };

    Look for more options in https://microsoft.github.io/monaco-editor/typedoc/variables/editor.EditorOptions.html

    Check the interface documentation for more details.

*/