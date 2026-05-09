// android/app/src/main/java/com/incoboytech/incocode/MainActivity.kt
package com.incoboytech.incocode

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    /**
     * Retourne le nom du composant principal enregistré dans index.js
     */
    override fun getMainComponentName(): String = "IncoCode"

    /**
     * Retourne l'instance du ReactActivityDelegate.
     * Les flags NewArchitecture sont activés via fabricEnabled.
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
