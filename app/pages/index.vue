<template>
  <div class="container mx-auto px-4 py-12 max-w-6xl">
    <!-- Hero Section -->
    <section class="text-center mb-20">
      <div class="inline-block mb-6">
        <img src="/logos/logo.svg" alt="ボイス素材作るくん" class="w-24 h-24 mx-auto" />
      </div>
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
        長時間の音声ファイルを<br class="md:hidden" />簡単に切り抜き
      </h1>
      <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        無音検出で自動的に音声区間を抽出。<br>
        ブラウザだけで動作するので、ファイルをアップロードする必要はありません。
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <NuxtLink
          to="/tool"
          class="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-lg"
        >
          <Icon name="mdi:play-circle" class="text-2xl" />
          今すぐ使ってみる
        </NuxtLink>
        <NuxtLink
          to="/splitter"
          class="inline-flex items-center gap-2 px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-medium text-lg"
        >
          <Icon name="mdi:call-split" class="text-2xl" />
          ファイル分割ツール
        </NuxtLink>
      </div>
    </section>

    <!-- Tools Section -->
    <section class="mb-12">
      <div class="grid md:grid-cols-2 gap-6">
        <NuxtLink
          to="/tool"
          class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-105"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon name="mdi:content-cut" class="text-4xl" />
            </div>
            <div>
              <h3 class="text-2xl font-bold">音声切り抜きツール</h3>
              <p class="text-white/80 text-sm">メインツール</p>
            </div>
          </div>
          <p class="text-white/90">無音検出で自動的に音声区間を抽出し、必要な部分だけを切り出します。</p>
        </NuxtLink>

        <NuxtLink
          to="/splitter"
          class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-105"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon name="mdi:call-split" class="text-4xl" />
            </div>
            <div>
              <h3 class="text-2xl font-bold">ファイル分割ツール</h3>
              <p class="text-white/80 text-sm">サブツール</p>
            </div>
          </div>
          <p class="text-white/90">大容量のWAVファイルを扱いやすいサイズに分割します。</p>
        </NuxtLink>
      </div>
    </section>

    <!-- Features Section -->
    <section class="mb-20">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">主な機能</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon name="mdi:radar" class="text-primary-500 text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">自動音声検出</h3>
          <p class="text-gray-600">無音部分を自動で検出し、音声区間だけを抽出。しきい値と最小音声長を調整可能。</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon name="mdi:waveform" class="text-primary-500 text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">波形表示</h3>
          <p class="text-gray-600">音声を視覚的に確認。ズーム機能で詳細な編集が可能。再生位置もリアルタイムで表示。</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon name="mdi:download" class="text-primary-500 text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">一括エクスポート</h3>
          <p class="text-gray-600">複数の音声区間をキューに追加し、ZIPファイルで一括ダウンロード。</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon name="mdi:shield-check" class="text-primary-500 text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">プライバシー保護</h3>
          <p class="text-gray-600">ファイルはサーバーに送信されず、全ての処理がブラウザ上で完結。</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon name="mdi:keyboard" class="text-primary-500 text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">ショートカット対応</h3>
          <p class="text-gray-600">キーボードショートカットで効率的に操作。矢印キーで区間移動、Enterでキューに追加。</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon name="mdi:currency-usd-off" class="text-primary-500 text-2xl" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">完全無料</h3>
          <p class="text-gray-600">登録不要、制限なし。全ての機能を無料でご利用いただけます。</p>
        </div>
      </div>
    </section>

    <!-- How to Use Section -->
    <section class="mb-20">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">使い方</h2>
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="flex gap-4 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">WAVファイルを選択</h3>
            <p class="text-gray-600">ローカルのWAVファイルを読み込みます。</p>
          </div>
        </div>

        <div class="flex gap-4 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">音声区間を検出</h3>
            <p class="text-gray-600">自動検出ボタンで無音部分を除いた音声区間を抽出。</p>
          </div>
        </div>

        <div class="flex gap-4 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">区間を選択してキューに追加</h3>
            <p class="text-gray-600">必要な区間を選択し、エクスポートキューに追加。</p>
          </div>
        </div>

        <div class="flex gap-4 items-start">
          <div class="flex-shrink-0 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">一括エクスポート</h3>
            <p class="text-gray-600">ZIPファイルとしてまとめてダウンロード。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="text-center bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 text-white">
      <h2 class="text-3xl font-bold mb-4">今すぐ始めましょう</h2>
      <p class="text-lg mb-8 opacity-90">登録不要、インストール不要。ブラウザだけで使えます。</p>
      <NuxtLink
        to="/tool"
        class="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg font-medium text-lg"
      >
        <Icon name="mdi:rocket-launch" class="text-2xl" />
        ツールを使う
      </NuxtLink>
    </section>

    <!-- Footer Links -->
    <footer class="mt-16 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
      <div class="flex items-center justify-center gap-6 mb-4">
        <NuxtLink to="/privacy" class="hover:text-primary-500 transition">プライバシーポリシー</NuxtLink>
        <NuxtLink to="/terms" class="hover:text-primary-500 transition">利用規約</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'ボイス素材作るくん - WAVファイル音声切り抜きツール',
  meta: [
    { name: 'description', content: '長時間のWAVファイルから必要な部分を簡単に切り抜けるWebアプリケーション。無音検出による自動区間抽出、波形表示、一括エクスポート機能を搭載。完全無料、登録不要。' }
  ]
})
</script>
