// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import ReactRefreshPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import { Configuration, WebpackPluginInstance } from "webpack";
import type {
  ConnectHistoryApiFallbackOptions,
  Configuration as WebpackDevServerConfiguration,
} from "webpack-dev-server";

import type { WebpackArgv } from "@lichtblick/suite-base/WebpackArgv";
import { makeConfig } from "@lichtblick/suite-base/webpack";
import * as palette from "@lichtblick/theme/src/palette";

export interface WebpackConfiguration extends Configuration {
  devServer?: WebpackDevServerConfiguration;
}

export type ConfigParams = {
  /** Directory to find `entrypoint` and `tsconfig.json`. */
  contextPath: string;
  entrypoint: string;
  outputPath: string;
  publicPath?: string;
  /** Source map (`devtool`) setting to use for production builds */
  prodSourceMap: string | false;
  /** Set the app version information */
  version: string;
  /** Needs to be overridden for react-router */
  historyApiFallback?: ConnectHistoryApiFallbackOptions;
  /** Customizations to index.html */
  indexHtmlOptions?: Partial<HtmlWebpackPlugin.Options>;
};

export const devServerConfig = (params: ConfigParams): WebpackConfiguration => ({
  // Use empty entry to avoid webpack default fallback to /src
  entry: {},

  // Output path must be specified here for HtmlWebpackPlugin within render config to work
  output: {
    publicPath: params.publicPath ?? "",
    path: params.outputPath,
  },

  devServer: {
    static: {
      directory: params.outputPath,
    },
    historyApiFallback: params.historyApiFallback,
    hot: true,
    // The problem and solution are described at <https://github.com/webpack/webpack-dev-server/issues/1604>.
    // When running in dev mode two errors are logged to the dev console:
    //  "Invalid Host/Origin header"
    //  "[WDS] Disconnected!"
    // Since we are only connecting to localhost, DNS rebinding attacks are not a concern during dev
    allowedHosts: "all",
    headers: {
      // Enable cross-origin isolation: https://resourcepolicy.fyi
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "credentialless",
    },

    client: {
      overlay: {
        runtimeErrors: (error) => {
          // Suppress overlays for importScript errors from terminated webworkers.
          //
          // When a webworker is terminated, any pending `importScript` calls are cancelled by the
          // browser. These appear in the devtools network tab as "(cancelled)" and bubble up to the
          // parent page as errors which trigger `window.onerror`.
          //
          // webpack devserver attaches to the window error handler surface unhandled errors sent to
          // the page. However this kind of error is a false-positive for a worker that is
          // terminated because we do not care that its network requests were cancelled since the
          // worker itself is gone.
          //
          // Will this hide real importScript errors during development?
          // It is possible that a worker encounters this error during normal operation (if
          // importing a script does fail for a legitimate reason). In that case we expect the
          // worker logic that depended on the script to fail execution and trigger other kinds of
          // errors. The developer can still see the importScripts error in devtools console.
          if (
            error.message.startsWith(
              `Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope'`,
            )
          ) {
            return false;
          }

          return true;
        },
      },
    },
  },

  plugins: [new CleanWebpackPlugin()],
});

export const mainConfig =
  (params: ConfigParams) =>
  (env: unknown, argv: WebpackArgv): Configuration => {
    const isDev = argv.mode === "development";
    const isServe = argv.env?.WEBPACK_SERVE ?? false;

    const allowUnusedVariables = isDev;

    const plugins: WebpackPluginInstance[] = [];

    if (isServe) {
      plugins.push(new ReactRefreshPlugin());
    }

    const appWebpackConfig = makeConfig(env, argv, {
      allowUnusedVariables,
      version: params.version,
    });

    const config: Configuration = {
      name: "main",

      ...appWebpackConfig,

      target: "web",
      context: params.contextPath,
      entry: params.entrypoint,
      devtool: isDev ? "eval-cheap-module-source-map" : params.prodSourceMap,

      output: {
        publicPath: params.publicPath ?? "auto",

        // Output filenames should include content hashes in order to cache bust when new versions are available
        filename: isDev ? "[name].js" : "[name].[contenthash].js",

        path: params.outputPath,
      },

      plugins: [
        ...plugins,
        ...(appWebpackConfig.plugins ?? []),
        new CopyPlugin({
          patterns: [{ from: path.resolve(__dirname, "..", "public") }],
        }),
        new HtmlWebpackPlugin({
          templateContent: ({ htmlWebpackPlugin }) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="mobile-web-app-capable" content="yes">
      ${htmlWebpackPlugin.options.foxgloveExtraHeadTags}
      <style type="text/css" id="loading-styles">
        body {
          margin: 0;
        }
      #splash-screen {
        position: fixed;
        inset: 0;
        display: flex;
        background-color: ${palette.light.background?.default};
        color: ${palette.light.text?.primary};
        justify-content: center;
        align-items: center;
      }
      @media (prefers-color-scheme: dark) {
        #splash-screen {
          background-color: ${palette.dark.background?.default};
          color: ${palette.dark.text?.primary};
        }
      }
      #splash-screen > svg {
        max-width: 100%;
        display: block;
        margin: auto;
      }
        #root {
          height: 100vh;
          background-color: ${palette.light.background?.default};
          color: ${palette.light.text?.primary};
        }
        @media (prefers-color-scheme: dark) {
          #root {
            background-color: ${palette.dark.background?.default};
            color: ${palette.dark.text?.primary};
          }
        }
      </style>
    </head>
    <script>
      global = globalThis;
      globalThis.FLORA_SUITE_DEFAULT_LAYOUT = [/*FLORA_SUITE_DEFAULT_LAYOUT_PLACEHOLDER*/][0];
    </script>
    <body><div id="splash-screen"><svg width="325" height="96" viewBox="0 0 650 192" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M143.487 7H38.1422C17.0768 7 0 23.6819 0 44.2602V147.169C0 167.747 17.0768 184.429 38.1422 184.429H143.487C164.553 184.429 181.629 167.747 181.629 147.169V44.2602C181.629 23.6819 164.553 7 143.487 7Z" fill="url(#paint0_linear_28_9)"/>
<g filter="url(#filter0_dii_28_9)">
<path d="M148.459 132.171V63.1285L88.5287 97.6495L148.459 132.171Z" fill="#DD5A35"/>
<path d="M148.459 63.1285L88.5287 28.6075L88.5287 97.6495L148.459 63.1285Z" fill="#F2BA44"/>
<path d="M88.5287 28.6075L28.5988 63.1285L88.5287 97.6495L88.5287 28.6075Z" fill="#50AF95"/>
<path d="M28.5988 63.1285V132.171L88.5287 97.6495L28.5988 63.1285Z" fill="#3D8AC1"/>
<path d="M28.5988 132.171L88.5287 166.692L88.5287 97.6495L28.5988 132.171Z" fill="#9D4A95"/>
<path d="M88.5287 166.692L148.459 132.171L88.5287 97.6495L88.5287 166.692Z" fill="#C93271"/>
<path d="M131.987 72.7664V122.533L88.5286 147.416L45.0707 122.533V72.7664L88.5286 47.8832L131.987 72.7664Z" fill="white" fill-opacity="0.24"/>
<path d="M113.412 83.4556V111.843L88.5287 126.037L63.6455 111.843V83.4556L88.5287 69.2617L113.412 83.4556Z" fill="#394597"/>
<path d="M86.7763 100.671L86.7763 159.197H90.2809L90.2809 100.671H86.7763Z" fill="#394597"/>
<path d="M35.6429 129.934L86.7763 100.671L85.0007 97.6496L33.8557 126.919L35.6429 129.934Z" fill="#394597"/>
<path d="M86.7763 94.6277L35.6429 65.3647L33.8557 68.3799L85.0007 97.6496L86.7763 94.6277Z" fill="#394597"/>
<path d="M90.2809 94.6277L90.2809 36.1016H86.7763L86.7763 94.6277H90.2809Z" fill="#394597"/>
<path d="M92.0565 97.6496L143.201 68.3799L141.414 65.3647L90.2809 94.6277L92.0565 97.6496Z" fill="#394597"/>
<path d="M90.2809 100.671L141.414 129.934L143.201 126.919L92.0565 97.6496L90.2809 100.671Z" fill="#394597"/>
<path d="M96.5893 31.0607C96.5893 35.5126 92.9804 39.1215 88.5286 39.1215C84.0768 39.1215 80.4678 35.5126 80.4678 31.0607C80.4678 26.6089 84.0768 23 88.5286 23C92.9804 23 96.5893 26.6089 96.5893 31.0607Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M88.5286 35.6168C91.0448 35.6168 93.0847 33.577 93.0847 31.0607C93.0847 28.5445 91.0448 26.5047 88.5286 26.5047C86.0123 26.5047 83.9725 28.5445 83.9725 31.0607C83.9725 33.577 86.0123 35.6168 88.5286 35.6168ZM88.5286 39.1215C92.9804 39.1215 96.5893 35.5126 96.5893 31.0607C96.5893 26.6089 92.9804 23 88.5286 23C84.0768 23 80.4678 26.6089 80.4678 31.0607C80.4678 35.5126 84.0768 39.1215 88.5286 39.1215Z" fill="#394597"/>
<path d="M154.767 131.294C154.767 135.746 151.158 139.355 146.706 139.355C142.254 139.355 138.645 135.746 138.645 131.294C138.645 126.843 142.254 123.234 146.706 123.234C151.158 123.234 154.767 126.843 154.767 131.294Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M146.706 135.85C149.222 135.85 151.262 133.811 151.262 131.294C151.262 128.778 149.222 126.738 146.706 126.738C144.19 126.738 142.15 128.778 142.15 131.294C142.15 133.811 144.19 135.85 146.706 135.85ZM146.706 139.355C151.158 139.355 154.767 135.746 154.767 131.294C154.767 126.843 151.158 123.234 146.706 123.234C142.254 123.234 138.645 126.843 138.645 131.294C138.645 135.746 142.254 139.355 146.706 139.355Z" fill="#394597"/>
<path d="M154.767 64.0047C154.767 68.4565 151.158 72.0654 146.706 72.0654C142.254 72.0654 138.645 68.4565 138.645 64.0047C138.645 59.5528 142.254 55.9439 146.706 55.9439C151.158 55.9439 154.767 59.5528 154.767 64.0047Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M146.706 68.5607C149.222 68.5607 151.262 66.5209 151.262 64.0047C151.262 61.4884 149.222 59.4486 146.706 59.4486C144.19 59.4486 142.15 61.4884 142.15 64.0047C142.15 66.5209 144.19 68.5607 146.706 68.5607ZM146.706 72.0654C151.158 72.0654 154.767 68.4565 154.767 64.0047C154.767 59.5528 151.158 55.9439 146.706 55.9439C142.254 55.9439 138.645 59.5528 138.645 64.0047C138.645 68.4565 142.254 72.0654 146.706 72.0654Z" fill="#394597"/>
<path d="M38.4118 64.0047C38.4118 68.4565 34.8029 72.0654 30.351 72.0654C25.8992 72.0654 22.2903 68.4565 22.2903 64.0047C22.2903 59.5528 25.8992 55.9439 30.351 55.9439C34.8029 55.9439 38.4118 59.5528 38.4118 64.0047Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M30.351 68.5607C32.8673 68.5607 34.9071 66.5209 34.9071 64.0047C34.9071 61.4884 32.8673 59.4486 30.351 59.4486C27.8348 59.4486 25.795 61.4884 25.795 64.0047C25.795 66.5209 27.8348 68.5607 30.351 68.5607ZM30.351 72.0654C34.8029 72.0654 38.4118 68.4565 38.4118 64.0047C38.4118 59.5528 34.8029 55.9439 30.351 55.9439C25.8992 55.9439 22.2903 59.5528 22.2903 64.0047C22.2903 68.4565 25.8992 72.0654 30.351 72.0654Z" fill="#394597"/>
<path d="M38.4118 131.294C38.4118 135.746 34.8029 139.355 30.351 139.355C25.8992 139.355 22.2903 135.746 22.2903 131.294C22.2903 126.843 25.8992 123.234 30.351 123.234C34.8029 123.234 38.4118 126.843 38.4118 131.294Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M30.351 135.85C32.8673 135.85 34.9071 133.811 34.9071 131.294C34.9071 128.778 32.8673 126.738 30.351 126.738C27.8348 126.738 25.795 128.778 25.795 131.294C25.795 133.811 27.8348 135.85 30.351 135.85ZM30.351 139.355C34.8029 139.355 38.4118 135.746 38.4118 131.294C38.4118 126.843 34.8029 123.234 30.351 123.234C25.8992 123.234 22.2903 126.843 22.2903 131.294C22.2903 135.746 25.8992 139.355 30.351 139.355Z" fill="#394597"/>
<path d="M96.5893 164.939C96.5893 169.391 92.9804 173 88.5286 173C84.0768 173 80.4678 169.391 80.4678 164.939C80.4678 160.487 84.0768 156.879 88.5286 156.879C92.9804 156.879 96.5893 160.487 96.5893 164.939Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M88.5286 169.495C91.0448 169.495 93.0847 167.456 93.0847 164.939C93.0847 162.423 91.0448 160.383 88.5286 160.383C86.0123 160.383 83.9725 162.423 83.9725 164.939C83.9725 167.456 86.0123 169.495 88.5286 169.495ZM88.5286 173C92.9804 173 96.5893 169.391 96.5893 164.939C96.5893 160.487 92.9804 156.879 88.5286 156.879C84.0768 156.879 80.4678 160.487 80.4678 164.939C80.4678 169.391 84.0768 173 88.5286 173Z" fill="#394597"/>
<path d="M96.5893 123.234C96.5893 127.685 92.9804 131.294 88.5286 131.294C84.0768 131.294 80.4678 127.685 80.4678 123.234C80.4678 118.782 84.0768 115.173 88.5286 115.173C92.9804 115.173 96.5893 118.782 96.5893 123.234Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M88.5286 127.79C91.0448 127.79 93.0847 125.75 93.0847 123.234C93.0847 120.717 91.0448 118.678 88.5286 118.678C86.0123 118.678 83.9725 120.717 83.9725 123.234C83.9725 125.75 86.0123 127.79 88.5286 127.79ZM88.5286 131.294C92.9804 131.294 96.5893 127.685 96.5893 123.234C96.5893 118.782 92.9804 115.173 88.5286 115.173C84.0768 115.173 80.4678 118.782 80.4678 123.234C80.4678 127.685 84.0768 131.294 88.5286 131.294Z" fill="#394597"/>
<path d="M96.5893 72.0654C96.5893 76.5173 92.9804 80.1262 88.5286 80.1262C84.0768 80.1262 80.4678 76.5173 80.4678 72.0654C80.4678 67.6136 84.0768 64.0047 88.5286 64.0047C92.9804 64.0047 96.5893 67.6136 96.5893 72.0654Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M88.5286 76.6215C91.0448 76.6215 93.0847 74.5817 93.0847 72.0654C93.0847 69.5492 91.0448 67.5093 88.5286 67.5093C86.0123 67.5093 83.9725 69.5492 83.9725 72.0654C83.9725 74.5817 86.0123 76.6215 88.5286 76.6215ZM88.5286 80.1262C92.9804 80.1262 96.5893 76.5173 96.5893 72.0654C96.5893 67.6136 92.9804 64.0047 88.5286 64.0047C84.0768 64.0047 80.4678 67.6136 80.4678 72.0654C80.4678 76.5173 84.0768 80.1262 88.5286 80.1262Z" fill="#394597"/>
<path d="M70.4025 117.422C66.5471 119.648 61.6172 118.327 59.3913 114.472C57.1654 110.617 58.4863 105.687 62.3417 103.461C66.1971 101.235 71.127 102.556 73.3529 106.411C75.5788 110.267 74.2579 115.197 70.4025 117.422Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M62.4264 112.72C63.6845 114.899 66.471 115.645 68.6501 114.387C70.8293 113.129 71.5759 110.343 70.3178 108.164C69.0597 105.984 66.2732 105.238 64.0941 106.496C61.9149 107.754 61.1683 110.541 62.4264 112.72ZM59.3913 114.472C61.6172 118.327 66.5471 119.648 70.4025 117.422C74.2579 115.197 75.5788 110.267 73.3529 106.411C71.127 102.556 66.1971 101.235 62.3417 103.461C58.4863 105.687 57.1654 110.617 59.3913 114.472Z" fill="#394597"/>
<path d="M114.715 91.8383C110.86 94.0642 105.93 92.7433 103.704 88.8879C101.478 85.0325 102.799 80.1026 106.655 77.8767C110.51 75.6508 115.44 76.9717 117.666 80.8271C119.892 84.6825 118.571 89.6124 114.715 91.8383Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M106.739 87.1355C107.998 89.3147 110.784 90.0613 112.963 88.8032C115.142 87.545 115.889 84.7586 114.631 82.5795C113.373 80.4003 110.586 79.6537 108.407 80.9118C106.228 82.1699 105.481 84.9564 106.739 87.1355ZM103.704 88.8879C105.93 92.7433 110.86 94.0642 114.715 91.8383C118.571 89.6124 119.892 84.6825 117.666 80.8271C115.44 76.9717 110.51 75.6508 106.655 77.8767C102.799 80.1026 101.478 85.0325 103.704 88.8879Z" fill="#394597"/>
<path d="M114.715 103.461C118.571 105.687 119.892 110.617 117.666 114.472C115.44 118.327 110.51 119.648 106.655 117.422C102.799 115.197 101.478 110.267 103.704 106.411C105.93 102.556 110.86 101.235 114.715 103.461Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M114.631 112.72C115.889 110.541 115.142 107.754 112.963 106.496C110.784 105.238 107.998 105.984 106.739 108.164C105.481 110.343 106.228 113.129 108.407 114.387C110.586 115.645 113.373 114.899 114.631 112.72ZM117.666 114.472C119.892 110.617 118.571 105.687 114.715 103.461C110.86 101.235 105.93 102.556 103.704 106.411C101.478 110.267 102.799 115.197 106.655 117.422C110.51 119.648 115.44 118.327 117.666 114.472Z" fill="#394597"/>
<path d="M70.4025 77.8767C74.2579 80.1026 75.5788 85.0325 73.3529 88.8879C71.127 92.7433 66.1971 94.0642 62.3417 91.8383C58.4863 89.6124 57.1654 84.6825 59.3913 80.8272C61.6172 76.9718 66.5471 75.6508 70.4025 77.8767Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M70.3178 87.1356C71.5759 84.9564 70.8293 82.17 68.6501 80.9118C66.471 79.6537 63.6845 80.4004 62.4264 82.5795C61.1683 84.7586 61.9149 87.5451 64.0941 88.8032C66.2732 90.0613 69.0597 89.3147 70.3178 87.1356ZM73.3529 88.8879C75.5788 85.0325 74.2579 80.1026 70.4025 77.8767C66.5471 75.6508 61.6172 76.9718 59.3913 80.8272C57.1654 84.6825 58.4863 89.6124 62.3417 91.8383C66.1971 94.0642 71.127 92.7433 73.3529 88.8879Z" fill="#394597"/>
<path d="M84.6635 107.813C83.3141 107.813 82.2202 106.719 82.2202 105.37V90.8365C82.2202 89.1796 83.5634 87.8365 85.2202 87.8365H93.2006C94.2979 87.8365 95.1875 88.726 95.1875 89.8234C95.1875 90.9207 94.2979 91.8103 93.2006 91.8103H89.2951C88.0866 91.8103 87.1068 92.79 87.1068 93.9986C87.1068 95.2072 88.0866 96.1869 89.2951 96.1869H92.0406C93.1453 96.1869 94.0409 97.0825 94.0409 98.1873C94.0409 99.292 93.1453 100.188 92.0406 100.188H90.1068C88.45 100.188 87.1068 101.531 87.1068 103.188V105.37C87.1068 106.719 86.0129 107.813 84.6635 107.813Z" fill="white"/>
</g>
<path d="M219.256 126V54.576H264.856V68.784H236.44V84.432H260.824V98.736H236.44V126H219.256ZM277.194 126V54.576H294.378V111.6H322.122V126H277.194ZM359.822 127.344C340.334 127.344 327.086 113.328 327.086 89.904C327.086 66.48 340.334 53.232 359.822 53.232C379.31 53.232 392.558 66.576 392.558 89.904C392.558 113.328 379.31 127.344 359.822 127.344ZM359.822 112.56C369.23 112.56 375.086 103.824 375.086 89.904C375.086 76.08 369.23 67.92 359.822 67.92C350.414 67.92 344.654 76.08 344.654 89.904C344.654 103.824 350.414 112.56 359.822 112.56ZM423.003 68.112V87.312H430.683C438.843 87.312 443.163 83.76 443.163 77.04C443.163 70.32 438.843 68.112 430.683 68.112H423.003ZM463.611 126H444.411L431.259 100.848H423.003V126H405.819V54.576H432.027C447.291 54.576 459.963 59.76 459.963 77.04C459.963 87.504 455.067 94.224 447.675 97.68L463.611 126ZM488.596 96.336H503.188L501.652 90.288C499.732 83.184 497.908 74.64 495.988 67.344H495.604C493.876 74.832 491.956 83.184 490.132 90.288L488.596 96.336ZM510.58 126L506.452 109.584H485.332L481.204 126H463.732L485.908 54.576H506.452L528.628 126H510.58Z" fill="#29bee7"/>
<defs>
<filter id="filter0_dii_28_9" x="19.2903" y="18" width="138.477" height="160" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="1.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.59 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_28_9"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_28_9" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="5"/>
<feGaussianBlur stdDeviation="10.5"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.23 0"/>
<feBlend mode="normal" in2="shape" result="effect2_innerShadow_28_9"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="5"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.07 0"/>
<feBlend mode="normal" in2="effect2_innerShadow_28_9" result="effect3_innerShadow_28_9"/>
</filter>
<linearGradient id="paint0_linear_28_9" x1="90.8147" y1="7" x2="90.8147" y2="184.429" gradientUnits="userSpaceOnUse">
<stop stop-color="#F5F5F5"/>
<stop offset="1" stop-color="#D6D6D6"/>
</linearGradient>
</defs>
</svg>
</div>
      <div id="root"></div>
    </body>
  </html>
  `,
          foxgloveExtraHeadTags: `
            <title>Flora</title>
            <link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png" />
          `,
          ...params.indexHtmlOptions,
        }),
      ],
    };

    return config;
  };
