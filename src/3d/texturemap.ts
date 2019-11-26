import * as THREE from 'three';

/**
 * テクスチャマップクラス
 */
export default class Texturemap {

	/**
	 * コンストラクタ
	 * @constructor
	 */
	constructor() {

		// 何もしない
	}

	/**
	 * エンティティにテクスチャを貼り付ける（単純）
	 *  @param {string} image: テクスチャファイル名
	 */
	public Box(image: string) {

		// テクスチャオブジェクトを作成
		const texture = new THREE.TextureLoader().load(image);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.type = THREE.FloatType;

		return texture;
	}

	/**
	 * エンティティにテクスチャを貼り付ける（天地無用）
	 *  @param {THREE.BoxGeometry} geometry: ジオメトリオブジェクト
	 *  @param {string} image: テクスチャファイル名
	 */
	public TopBox(geometry: THREE.BoxGeometry, image: string) {

		// 面のマテリアル番号をすべて 0 にする（単一テクスチャーを使うように）
		geometry.faces.forEach (face => { face.materialIndex = 0 });

		// テクスチャマッピングデータ
		const tex = {

			resolution: { width: 16, height: 48 },
			uv: [
				{ tag: 'left',   x: 0, y: 16, w: 16, h: 16, topleft: 1 },
				{ tag: 'right',  x: 0, y: 16, w: 16, h: 16, topleft: 3 },
				{ tag: 'top',    x: 0, y: 0,  w: 16, h: 16, topleft: 0 },
				{ tag: 'bottom', x: 0, y: 32, w: 16, h: 16, topleft: 2 },
				{ tag: 'front',  x: 0, y: 16, w: 16, h: 16, topleft: 0 },
				{ tag: 'back',   x: 0, y: 16, w: 16, h: 16, topleft: 2 }
			]
		}

		const points = [];
		for (let i = 0; i < 6; i++) {

			// テクスチャデータから矩形情報を作成（座標を width または height で割る）
			// また、座標系はボトムアップの為、垂直座標の上下を反転させる
			const rect = {

				left:   tex.uv[i].x / tex.resolution.width,
				top:    1 - tex.uv[i].y / tex.resolution.height,
				right:  (tex.uv[i].x + tex.uv[i].w) / tex.resolution.width,
				bottom: 1 - (tex.uv[i].y + tex.uv[i].h) / tex.resolution.height
			}

			// 矩形情報から頂点（UV Vertex）データを作成
			// order は 画像の回転を修正する為の情報
			points[i] = [

				{ x: rect.left,  y: rect.top,    order: (tex.uv[i].topleft + 0) % 4 },
				{ x: rect.right, y: rect.top,    order: (tex.uv[i].topleft + 1) % 4 },
				{ x: rect.right, y: rect.bottom, order: (tex.uv[i].topleft + 2) % 4 },
				{ x: rect.left,  y: rect.bottom, order: (tex.uv[i].topleft + 3) % 4 }
			];

			// ソートを使ってテクスチャの左上から順になるようにする（画像は上下反転）
			//  3 _____ 2
			//   |    /|
			//   |  /  |
			//   |/____|
			//  0       1
			points[i] = points[i].sort((a,b) => { return b.order - a.order });
		}

		// 頂点データから三角形データ（THREE.Vector2 の Array）を作成する関数
		// point   : 4点の頂点座標の array
		// indices : 作成する3点の頂点のindexを指定する array
		//           Geometry.face[] の頂点順に従って指定する必要がある
		// shift   : テクスチャの向きを回転させる時は 1 ～ 3 加算する
		const triangle = (point, indices, shift) => {

			shift = shift ? shift : 0;
			indices = indices.map(v => (v + shift) % 4);
			return [

				new THREE.Vector2(point[ indices[0] ].x, point[ indices[0] ].y),
				new THREE.Vector2(point[ indices[1] ].x, point[ indices[1] ].y),
				new THREE.Vector2(point[ indices[2] ].x, point[ indices[2] ].y)
			];
		}

		// テクスチャ頂点情報をジオメトリへ追加（THREE.Geometry.faceVertexUvs）
		geometry.faceVertexUvs[0] = [

			// right
			triangle(points[0], [ 1, 2, 0 ], 1),
			triangle(points[0], [ 2, 3, 0 ], 1),

			// left
			triangle(points[1], [ 1, 2, 0 ], 3),
			triangle(points[1], [ 2, 3, 0 ], 3),

			// top
			triangle(points[2], [ 1, 2, 0 ], 2),
			triangle(points[2], [ 2, 3, 0 ], 2),

			// bottom
			triangle(points[3], [ 1, 2, 0 ], 2),
			triangle(points[3], [ 2, 3, 0 ], 2),

			// front
			triangle(points[4], [ 1, 2, 0 ], 2),
			triangle(points[4], [ 2, 3, 0 ], 2),

			// back
			triangle(points[5], [ 1, 2, 0 ], 0),
			triangle(points[5], [ 2, 3, 0 ], 0)
		];

		// ジオメトリの更新フラグを立てる
		geometry.uvsNeedUpdate = true;

		// テクスチャオブジェクトを作成
		const texture = new THREE.TextureLoader().load(image);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.type = THREE.FloatType;

		return texture;
	}

	/**
	 * エンティティにテクスチャを貼り付ける（植物系）
	 *  @param {string} image: テクスチャファイル名
	 */
	public Plant(image: string) {

		// テクスチャオブジェクトを作成
		const texture = new THREE.TextureLoader().load(image);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.type = THREE.FloatType;

		return texture;
	}

	/**
	 * エンティティにテクスチャを貼り付ける（ハーフブロック系）
	 *  @param {THREE.BoxGeometry} geometry: ジオメトリオブジェクト
	 *  @param {string} image: テクスチャファイル名
	 *  @param {string} type: テクスチャタイプ
	 * @param {boolean} ctrlKey: CTRL キーが押されているか	 
	 */
	public Slab(geometry: THREE.BoxGeometry, image: string, type: string, ctrlKey: boolean) {

		// 面のマテリアル番号をすべて 0 にする（単一テクスチャーを使うように）
		geometry.faces.forEach (face => { face.materialIndex = 0 });

		let tex, y;
		if (type == 'Slab' || type == 'TopBox') {

			// テクスチャマッピングデータ
			y = ctrlKey ? 16 : 24;
			tex = {

				resolution: { width: 16, height: 48 },
				uv: [
					{ tag: 'left',   x: 0, y: y,  w: 16, h: 8,  topleft: 1 },
					{ tag: 'right',  x: 0, y: y,  w: 16, h: 8,  topleft: 3 },
					{ tag: 'top',    x: 0, y: 0,  w: 16, h: 16, topleft: 0 },
					{ tag: 'bottom', x: 0, y: 32, w: 16, h: 16, topleft: 2 },
					{ tag: 'front',  x: 0, y: y,  w: 16, h: 8,  topleft: 0 },
					{ tag: 'back',   x: 0, y: y,  w: 16, h: 8,  topleft: 2 }
				]
			}

		} else {

			// テクスチャマッピングデータ
			y = ctrlKey ? 0 : 8;
			tex = {

				resolution: { width: 16, height: 16 },
				uv: [
					{ tag: 'left',   x: 0, y: y, w: 16, h: 8,  topleft: 1 },
					{ tag: 'right',  x: 0, y: y, w: 16, h: 8,  topleft: 3 },
					{ tag: 'top',    x: 0, y: 0, w: 16, h: 16, topleft: 0 },
					{ tag: 'bottom', x: 0, y: 0, w: 16, h: 16, topleft: 2 },
					{ tag: 'front',  x: 0, y: y, w: 16, h: 8,  topleft: 0 },
					{ tag: 'back',   x: 0, y: y, w: 16, h: 8,  topleft: 2 }
				]
			}
		}

		const points = [];
		for (let i = 0; i < 6; i++) {

			// テクスチャデータから矩形情報を作成（座標を width または height で割る）
			// また、座標系はボトムアップの為、垂直座標の上下を反転させる
			const rect = {

				left:   tex.uv[i].x / tex.resolution.width,
				top:    1 - tex.uv[i].y / tex.resolution.height,
				right:  (tex.uv[i].x + tex.uv[i].w) / tex.resolution.width,
				bottom: 1 - (tex.uv[i].y + tex.uv[i].h) / tex.resolution.height
			}

			// 矩形情報から頂点（UV Vertex）データを作成
			// order は 画像の回転を修正する為の情報
			points[i] = [

				{ x: rect.left,  y: rect.top,    order: (tex.uv[i].topleft + 0) % 4 },
				{ x: rect.right, y: rect.top,    order: (tex.uv[i].topleft + 1) % 4 },
				{ x: rect.right, y: rect.bottom, order: (tex.uv[i].topleft + 2) % 4 },
				{ x: rect.left,  y: rect.bottom, order: (tex.uv[i].topleft + 3) % 4 }
			];

			// ソートを使ってテクスチャの左上から順になるようにする（画像は上下反転）
			//  3 _____ 2
			//   |    /|
			//   |  /  |
			//   |/____|
			//  0       1
			points[i] = points[i].sort((a,b) => { return b.order - a.order });
		}

		// 頂点データから三角形データ（THREE.Vector2 の Array）を作成する関数
		// point   : 4点の頂点座標の array
		// indices : 作成する3点の頂点のindexを指定する array
		//           Geometry.face[] の頂点順に従って指定する必要がある
		// shift   : テクスチャの向きを回転させる時は 1 ～ 3 加算する
		const triangle = (point, indices, shift) => {

			shift = shift ? shift : 0;
			indices = indices.map(v => (v + shift) % 4);
			return [

				new THREE.Vector2(point[ indices[0] ].x, point[ indices[0] ].y),
				new THREE.Vector2(point[ indices[1] ].x, point[ indices[1] ].y),
				new THREE.Vector2(point[ indices[2] ].x, point[ indices[2] ].y)
			];
		}

		// テクスチャ頂点情報をジオメトリへ追加（THREE.Geometry.faceVertexUvs）
		geometry.faceVertexUvs[0] = [

			// right
			triangle(points[0], [ 1, 2, 0 ], 1),
			triangle(points[0], [ 2, 3, 0 ], 1),

			// left
			triangle(points[1], [ 1, 2, 0 ], 3),
			triangle(points[1], [ 2, 3, 0 ], 3),

			// top
			triangle(points[2], [ 1, 2, 0 ], 2),
			triangle(points[2], [ 2, 3, 0 ], 2),

			// bottom
			triangle(points[3], [ 1, 2, 0 ], 2),
			triangle(points[3], [ 2, 3, 0 ], 2),

			// front
			triangle(points[4], [ 1, 2, 0 ], 2),
			triangle(points[4], [ 2, 3, 0 ], 2),

			// back
			triangle(points[5], [ 1, 2, 0 ], 0),
			triangle(points[5], [ 2, 3, 0 ], 0)
		];

		// ジオメトリの更新フラグを立てる
		geometry.uvsNeedUpdate = true;

		// テクスチャオブジェクトを作成
		const texture = new THREE.TextureLoader().load(image);
		texture.magFilter = THREE.NearestFilter;
		texture.minFilter = THREE.NearestFilter;
		texture.type = THREE.FloatType;

		return texture;
	}
}
