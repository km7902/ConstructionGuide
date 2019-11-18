module.exports = {

	// エントリーポイント
	entry: "./src/main.ts",

	// ファイルの出力設定
	output: {

		// 出力ファイルのディレクトリ名
		path: `${__dirname}/dist/js`,

		// 出力ファイル名
		filename: "ConstructionGuide.js"

	},

	// モード値
	// production  : 圧縮、最適化された状態で出力
	// development : ソースマップ有効で出力
	mode: "production",

	// ローカル開発用環境を立ち上げる
	// 実行時にブラウザが自動的に localhost を開く
	devServer: {
		contentBase: "dist",
		open: true
	},

	module: {
		rules: [
			{

				// 拡張子 .ts の場合
				test: /\.ts$/,
				// TypeScript をコンパイルする
				use: "ts-loader"

			}
		]
	},

	// import で .ts .js ファイルを解決する
	resolve: {
		extensions: [
			".ts", ".js"
		]
	},

	// ソースマップを有効化
	devtool: "source-map",

	// キャッシュ有効化
	cache: true,

	// 警告は無視する
	performance: {
		hints: false
	},
};
