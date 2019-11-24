import { SVGLoader } from '../../lib/SVGLoader';
import * as THREE from 'three';

/**
 * ファンクションズクラス
 */
export default class Functions {

	/* キャンバスオブジェクト */
	private readonly _canvas;
	private _width: number;
	private _height: number;

	/* ファンクションズ制御オブジェクト */
	private _functionsControl;

	/* マウス操作 */
	private _hoverFunctions: boolean;

	/* レイキャストオブジェクト */
	private readonly _raycaster: THREE.Raycaster;

	/**
	 * コンストラクタ
	 * @constructor
	 * @param {THREE.Scene} scene2d: 2D シーンオブジェクト
	 */
	constructor(scene2d: THREE.Scene) {

		// キャンバスを取得
		this._canvas = document.getElementById('ConstructionGuideApp');
		this._width = this._canvas.clientWidth;
		this._height = this._canvas.clientHeight;

		// マウスとの交差を調べたいものはファンクションズ制御に格納する
		this._functionsControl = [];

		// SVG オブジェクトを作成
		const SVGgroup = new THREE.Group();

		// SVG ファイルを読み込む（カメラリセット）
		this._SVGLoader('img/video.svg', SVGgroup);
		SVGgroup.scale.multiplyScalar(0.06);
		SVGgroup.scale.y *= - 1;
		SVGgroup.position.set(this._width / 2.34, (this._height / 2) - (this._height / 20), 0);
		scene2d.add(SVGgroup);

		// ファンクションズ制御に追加
		this._functionsControl.push(SVGgroup);

		// レイキャストを作成
		this._raycaster = new THREE.Raycaster();
	}

	/**
	 * フレーム毎の更新
	 * @param {THREE.Vector2} mouseUV: マウスカーソル座標
	 * @param {THREE.OrthographicCamera} camera2d: 2D カメラオブジェクト
	 */
	public _update(mouseUV: THREE.Vector2, camera2d: THREE.OrthographicCamera) {

		// マウス位置からまっすぐに伸びる光線ベクトルを生成
		this._raycaster.setFromCamera(mouseUV, camera2d);

		// その光線とぶつかったオブジェクトを得る
		let intersects = this._raycaster.intersectObjects(this._functionsControl, true);
		this._hoverFunctions = false;
		this._functionsControl.map(mesh => {

			if (intersects.length > 0 && mesh === intersects[0].object.parent) {

				// 2D 側でオブジェクトを得たことを通知する
				this._hoverFunctions = true;
			}
		});

		// interface.ts に通知する
		return this._hoverFunctions;
	}

	/**
	 * マウスイベント（クリック押下）
	 */
	public _mousedown() {

		// カメラリセットにマウスカーソルがあるとき
		return this._hoverFunctions;
	}

	/**
	 * SVG ファイルを読み込む
	 * @param {string} url: SVG ファイルの URL
	 * @param {THREE.Group} group: SVG オブジェクト
	 */
	private _SVGLoader(url: string, group: THREE.Group) {

		const guiData = {

			currentURL: url,
			drawFillShapes: true,
			drawStrokes: true,
			fillShapesWireframe: false,
			strokesWireframe: false,
			group: group,
			screenWidth: this._width,
			screenHeight: this._height
		}

		new SVGLoader().load(guiData.currentURL, function(data) {

			const paths = data.paths;

			for (let i = 0; i < paths.length; i++) {

				const path = paths[i];

				const fillColor = path.userData.style.fill;
				if (guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {

					const material = new THREE.MeshBasicMaterial({

						color: new THREE.Color().setStyle(fillColor),
						opacity: path.userData.style.fillOpacity,
						transparent: path.userData.style.fillOpacity < 1,
						side: THREE.DoubleSide,
						depthWrite: false,
						wireframe: guiData.fillShapesWireframe
					});

					const shapes = path.toShapes(true);

					for (let j = 0; j < shapes.length; j++) {

						const shape = shapes[j];

						const geometry = new THREE.ShapeBufferGeometry(shape);
						const mesh = new THREE.Mesh(geometry, material);

						guiData.group.add(mesh);
					}
				}

				const strokeColor = path.userData.style.stroke;

				if (guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {

					const material = new THREE.MeshBasicMaterial({

						color: new THREE.Color().setStyle(strokeColor),
						opacity: path.userData.style.strokeOpacity,
						transparent: path.userData.style.strokeOpacity < 1,
						side: THREE.DoubleSide,
						depthWrite: false,
						wireframe: guiData.strokesWireframe
					});

					for (let j = 0; j < path.subPaths.length; j++) {

						const subPath = path.subPaths[j];

						const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);

						if (geometry) {

							const mesh = new THREE.Mesh(geometry, material);

							guiData.group.add(mesh);
						}
					}
				}
			}
		});
	}

	/**
	 * テキストを表示する
	 * @param {string} text: 文字列
	 * 今のところ使用予定がないのでナレッジとして残しておく
	 */
	private _textWriter(text: string) {

		const font = new THREE.FontLoader().load(

			'fonts/Minecraft_Regular.json',

			function (font) {

				const material = new THREE.MeshBasicMaterial({
					color: 0x000000,
					transparent: true
				});
				const geometry = new THREE.ShapeBufferGeometry(

					font.generateShapes(text, 50, 0)
				);
				geometry.computeBoundingBox();

				const xMid = - 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

				geometry.translate( xMid, 0, 0 );

				const mesh = new THREE.Mesh(geometry, material);
				mesh.position.z = - 150;
				this._scene2d.add(mesh);
			}
		);
	}
}
